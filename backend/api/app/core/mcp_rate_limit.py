"""Request budgets for the mounted MCP app.

The MCP server is a Starlette app mounted beside the FastAPI routers, so the
Depends(check_rate_limit) every router uses never runs for it. This wraps the
mount and charges each HTTP request to the same budgets: a valid partner key
to that partner's, anything else to the shared per-IP pool. A bad key is not
rejected here; the tool that needs it says why, which a client can show.
"""

from __future__ import annotations

from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core import dependencies
from app.core.config import get_settings
from app.core.partner_keys import match_partner_key


class MCPRateLimitMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request = Request(scope)
        settings = get_settings()
        partner = None
        if settings.PARTNER_API_ENABLED:
            partner = match_partner_key(
                request.headers.get("x-api-key"), settings.PARTNER_API_KEYS
            )
        try:
            if partner is not None:
                await dependencies.get_partner_rate_limiter().check(
                    request, principal=partner.partner_id
                )
            else:
                await dependencies.get_rate_limiter().check(request)
        except HTTPException as e:
            response = JSONResponse(
                {"detail": e.detail}, status_code=e.status_code, headers=e.headers
            )
            await response(scope, receive, send)
            return
        await self.app(scope, receive, send)
