from typing import Any, Optional

from pydantic import ValidationError

from app.core.errors import CallerInputError


def _exception_chain(exc: Optional[BaseException]):
    # __cause__ only: fastmcp wraps tool errors with `raise ToolError from e`.
    # Following __context__ too would hide a real bug raised while handling a
    # caller error.
    seen = set()
    while exc is not None and id(exc) not in seen:
        seen.add(id(exc))
        yield exc
        exc = exc.__cause__


def _is_mcp_argument_error(exc: BaseException, event: dict) -> bool:
    # fastmcp re-raises every pydantic ValidationError from a tool, including
    # ones from our own code in the tool body. Only argument validation is the
    # caller's fault; pydantic titles those "call[<tool name>]".
    if not isinstance(exc, ValidationError) or not exc.title.startswith("call["):
        return False
    trace = (event.get("contexts") or {}).get("trace") or {}
    return trace.get("op") == "mcp.server"


def before_send(event: dict, hint: dict) -> Optional[dict]:
    exc_info: Any = hint.get("exc_info")
    if not exc_info:
        return event
    for exc in _exception_chain(exc_info[1]):
        if isinstance(exc, CallerInputError) or _is_mcp_argument_error(exc, event):
            return None
    return event
