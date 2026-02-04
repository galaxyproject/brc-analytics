import logging

from fastapi import APIRouter, Cookie, Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import get_settings
from app.services.auth_service import COOKIE_NAME, AuthService

logger = logging.getLogger(__name__)

router = APIRouter()

_auth_service: AuthService | None = None


def _get_auth_service() -> AuthService:
    global _auth_service
    if _auth_service is None:
        settings = get_settings()
        _auth_service = AuthService(settings.REDIS_URL)
    return _auth_service


@router.get("/login")
async def login() -> RedirectResponse:
    """Initiate the OIDC login flow.

    Redirects the browser to Keycloak's authorization endpoint with
    PKCE parameters. The code verifier is stored in Redis, keyed by the
    state parameter.
    """
    auth = _get_auth_service()
    authorization_url, _state = await auth.build_authorization_url()
    return RedirectResponse(url=authorization_url, status_code=302)


@router.get("/callback")
async def callback(
    code: str = "",
    state: str = "",
    error: str = "",
    error_description: str = "",
) -> Response:
    """Handle the OIDC callback from Keycloak.

    Exchanges the authorization code for tokens, stores them in Redis,
    and sets an httpOnly session cookie on the browser.
    """
    if error:
        logger.warning("Auth callback error: %s - %s", error, error_description)
        return JSONResponse(
            status_code=400,
            content={
                "error": error,
                "error_description": error_description,
            },
        )

    if not code or not state:
        return JSONResponse(
            status_code=400,
            content={"error": "Missing code or state parameter"},
        )

    auth = _get_auth_service()

    try:
        token_response = await auth.exchange_code(code, state)
    except ValueError as e:
        logger.warning("Code exchange failed (state validation): %s", e)
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid or expired state parameter"},
        )
    except Exception as e:
        logger.error("Code exchange failed: %s", e)
        return JSONResponse(
            status_code=500,
            content={"error": "Token exchange failed"},
        )

    session_id = await auth.create_session(token_response)

    settings = get_settings()
    resp = RedirectResponse(url=settings.FRONTEND_URL, status_code=302)
    secure_cookie = settings.ENVIRONMENT != "development"
    resp.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=secure_cookie,
        max_age=3600,
        path="/",
    )
    return resp


@router.get("/me")
async def me(
    brc_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> JSONResponse:
    """Return the current user's info from their session.

    Reads the session cookie, looks up tokens in Redis, and extracts
    claims from the access token. Attempts a token refresh if expired.
    """
    if not brc_session:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"},
        )

    auth = _get_auth_service()
    user_info = await auth.get_user_info(brc_session)

    if not user_info:
        resp = JSONResponse(
            status_code=401,
            content={"error": "Session expired or invalid"},
        )
        resp.delete_cookie(COOKIE_NAME, path="/")
        return resp

    return JSONResponse(content=user_info)


@router.post("/logout")
async def logout(
    brc_session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> JSONResponse:
    """Clear the user's session from Redis and remove the cookie."""
    if brc_session:
        auth = _get_auth_service()
        await auth.delete_session(brc_session)

    resp = JSONResponse(content={"message": "Logged out"})
    resp.delete_cookie(COOKIE_NAME, path="/")
    return resp
