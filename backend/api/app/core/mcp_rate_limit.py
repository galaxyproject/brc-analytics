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
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core import dependencies
from app.core.config import get_settings


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
        key = request.headers.get("x-api-key")
        if settings.PARTNER_API_ENABLED and key:
            # The same check the tools make, sunset included, so a retired key
            # never keeps the larger partner allowance.
            try:
                partner = dependencies.authenticate_partner_key(key)
            except HTTPException:
                partner = None
        # A spent budget raises HTTPException, which FastAPI's handler turns
        # into the same 429 and Retry-After the routers send.
        if partner is not None:
            await dependencies.get_partner_rate_limiter().check(
                request, principal=partner.partner_id
            )
        else:
            await dependencies.get_rate_limiter().check(request)
        await self.app(scope, receive, send)
