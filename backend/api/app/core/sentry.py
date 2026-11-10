import os
import re
from pathlib import Path
from types import TracebackType
from typing import Any, Optional

from fastmcp.exceptions import FastMCPError
from pydantic import ValidationError

from app.core.errors import CallerInputError

_APP_DIR = str(Path(__file__).resolve().parent.parent) + os.sep

# A kmindex query goes to Galaxy as a base64:// URL holding the user's
# sequences. Galaxy echoes the request in its error bodies, and bioblend puts
# the body in str(e), so a failed submit can carry the query into an event.
_QUERY_URL = re.compile(r"base64://\S+")
_QUERY_PLACEHOLDER = "base64://[Filtered]"


def _unwrap(exc: BaseException) -> BaseException:
    # fastmcp reports tool/resource failures as `raise ToolError(...) from e`.
    # Look through those wrappers only: any other exception in the chain is a
    # failure of its own (e.g. one raised while handling a caller error) and
    # has to be reported.
    while isinstance(exc, FastMCPError) and exc.__cause__ is not None:
        exc = exc.__cause__
    return exc


def _touches_app_code(tb: Optional[TracebackType]) -> bool:
    while tb is not None:
        if tb.tb_frame.f_code.co_filename.startswith(_APP_DIR):
            return True
        tb = tb.tb_next
    return False


def _is_mcp_argument_error(exc: BaseException, event: dict) -> bool:
    # fastmcp re-raises every pydantic ValidationError from a tool, including
    # ones from our own code in the tool body. Argument validation fails
    # before the tool function runs, so its traceback never reaches app code;
    # a body error always does, even one titled "call[...]" by a
    # TypeAdapter over a helper.
    if not isinstance(exc, ValidationError) or not exc.title.startswith("call["):
        return False
    if _touches_app_code(exc.__traceback__):
        return False
    trace = (event.get("contexts") or {}).get("trace") or {}
    return trace.get("op") == "mcp.server"


# bioblend logs a failed request's final error with the URL and object
# addresses baked into the message, so every job id opened a fresh issue and
# one Galaxy outage became dozens. Group on the message with those removed.
_VOLATILE = re.compile(r"\b(?:[0-9a-f]{16}){1,2}\b|0x[0-9a-f]+")


def _fingerprint_bioblend(event: dict) -> None:
    if event.get("logger") != "bioblend":
        return
    message = (event.get("logentry") or {}).get("message") or ""
    event["fingerprint"] = ["bioblend", _VOLATILE.sub("<id>", message)[:200]]


def _scrub(value: Any) -> Any:
    if isinstance(value, str):
        return _QUERY_URL.sub(_QUERY_PLACEHOLDER, value)
    return value


def _scrub_query_urls(event: dict) -> None:
    if "message" in event:
        event["message"] = _scrub(event["message"])
    logentry = event.get("logentry")
    if isinstance(logentry, dict):
        for key in ("message", "formatted"):
            if key in logentry:
                logentry[key] = _scrub(logentry[key])
        params = logentry.get("params")
        if isinstance(params, (list, tuple)):
            logentry["params"] = [_scrub(p) for p in params]
        elif isinstance(params, dict):
            logentry["params"] = {k: _scrub(v) for k, v in params.items()}
    for section, field in (("exception", "value"), ("breadcrumbs", "message")):
        container = event.get(section)
        if not isinstance(container, dict):
            continue
        for item in container.get("values") or []:
            if isinstance(item, dict) and field in item:
                item[field] = _scrub(item[field])


# Sentry's MCP integration records every tool argument on its span, with or
# without send_default_pii, so logan_submit's sequence would ride along on
# every traced call. Span data is only ever in transactions and, when the MCP
# span is the transaction itself, an event's trace context.
_MCP_SEQUENCE_ARGUMENT = "mcp.request.argument.sequence"


def _scrub_span_data(data: Any) -> None:
    if isinstance(data, dict) and _MCP_SEQUENCE_ARGUMENT in data:
        data[_MCP_SEQUENCE_ARGUMENT] = "[Filtered]"


def _scrub_mcp_arguments(event: dict) -> None:
    trace = (event.get("contexts") or {}).get("trace")
    if isinstance(trace, dict):
        _scrub_span_data(trace.get("data"))
    for span in event.get("spans") or []:
        if isinstance(span, dict):
            _scrub_span_data(span.get("data"))


def before_send_transaction(event: dict, hint: dict) -> Optional[dict]:
    _scrub_mcp_arguments(event)
    return event


def before_send(event: dict, hint: dict) -> Optional[dict]:
    _scrub_mcp_arguments(event)
    # Scrub first so the bioblend fingerprint is built from the cleaned message.
    _scrub_query_urls(event)
    _fingerprint_bioblend(event)
    exc_info: Any = hint.get("exc_info")
    if exc_info and exc_info[1] is not None:
        exc = _unwrap(exc_info[1])
        if isinstance(exc, CallerInputError) or _is_mcp_argument_error(exc, event):
            return None
    return event
