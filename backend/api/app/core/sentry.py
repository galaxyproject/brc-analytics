import os
from pathlib import Path
from types import TracebackType
from typing import Any, Optional

from fastmcp.exceptions import FastMCPError
from pydantic import ValidationError

from app.core.errors import CallerInputError

_APP_DIR = str(Path(__file__).resolve().parent.parent) + os.sep


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


def before_send(event: dict, hint: dict) -> Optional[dict]:
    exc_info: Any = hint.get("exc_info")
    if not exc_info or exc_info[1] is None:
        return event
    exc = _unwrap(exc_info[1])
    if isinstance(exc, CallerInputError) or _is_mcp_argument_error(exc, event):
        return None
    return event
