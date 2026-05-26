"""GitHub OAuth and session routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from starlette.config import Config

from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

_oauth = None


def _oauth_callback_url() -> str:
    """Must match GitHub OAuth app callback URL and the host users open in the browser."""
    base = get_settings().frontend_url.rstrip("/")
    return f"{base}/auth/github/callback"


def _frontend_redirect(path: str = "") -> str:
    base = get_settings().frontend_url.rstrip("/")
    return f"{base}{path}"


def _get_oauth():
    global _oauth
    if _oauth is not None:
        return _oauth
    settings = get_settings()
    if not settings.oauth_configured:
        return None
    from authlib.integrations.starlette_client import OAuth

    config = Config(environ={
        "GITHUB_CLIENT_ID": settings.github_oauth_client_id,
        "GITHUB_CLIENT_SECRET": settings.github_oauth_client_secret,
    })
    oauth = OAuth(config)
    oauth.register(
        name="github",
        client_id=settings.github_oauth_client_id,
        client_secret=settings.github_oauth_client_secret,
        access_token_url="https://github.com/login/oauth/access_token",
        authorize_url="https://github.com/login/oauth/authorize",
        api_base_url="https://api.github.com/",
        client_kwargs={"scope": "read:user public_repo"},
    )
    _oauth = oauth
    return _oauth


@router.get("/github/login")
async def github_login(request: Request):
    oauth = _get_oauth()
    if oauth is None:
        raise HTTPException(503, "GitHub OAuth is not configured")
    redirect_uri = _oauth_callback_url()
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback", name="github_callback")
async def github_callback(request: Request):
    oauth = _get_oauth()
    if oauth is None:
        raise HTTPException(503, "GitHub OAuth is not configured")

    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        err = type(e).__name__
        if "MismatchingState" in err or "mismatching_state" in str(e).lower():
            return RedirectResponse(
                url=_frontend_redirect(
                    "?auth_error=session_lost"
                    "&hint=Use+the+same+host+for+the+app+and+FRONTEND_URL+(e.g.+localhost%2C+not+127.0.0.1)"
                )
            )
        raise

    if not token or "access_token" not in token:
        return RedirectResponse(url=_frontend_redirect("?auth_error=token_exchange_failed"))

    import httpx

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {token['access_token']}",
                "Accept": "application/vnd.github+json",
            },
        )
        resp.raise_for_status()
        user = resp.json()

    request.session["github_access_token"] = token["access_token"]
    request.session["github_login"] = user.get("login")
    request.session["github_avatar_url"] = user.get("avatar_url")

    return RedirectResponse(url=_frontend_redirect("?auth_success=1"))


@router.post("/logout")
def logout(request: Request) -> dict:
    request.session.clear()
    return {"ok": True}


@router.get("/me")
def me(request: Request) -> dict:
    login = request.session.get("github_login")
    if not login:
        raise HTTPException(401, "Not signed in")
    return {
        "login": login,
        "avatar_url": request.session.get("github_avatar_url"),
    }
