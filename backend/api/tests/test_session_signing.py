"""Tests for binding assistant sessions to the browser."""

import pytest
from fastapi import HTTPException, Response

from app.core.config import BROWSER_COOKIE_NAME, get_settings
from app.core.session_signing import (
    bind_session,
    browser_cookie_name,
    clear_browser_cookie,
    require_bound,
    sign_browser_id,
)
from tests.conftest import FakeBrowserBindings

SECRET = "test-secret-32-bytes-min-aaaaaaaa"


@pytest.fixture(autouse=True)
def _settings(monkeypatch):
    monkeypatch.setenv("SESSION_COOKIE_SECRET", SECRET)
    monkeypatch.setenv("ENVIRONMENT", "development")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _browser(browser_id: str) -> dict[str, str]:
    """The cookies a browser with this id sends."""
    return {browser_cookie_name(): browser_id}


class TestSignBrowserId:
    def test_is_deterministic(self):
        assert sign_browser_id("abc") == sign_browser_id("abc")

    def test_differs_by_browser_and_secret(self, monkeypatch):
        signed = sign_browser_id("abc")
        assert signed != sign_browser_id("xyz")
        monkeypatch.setenv("SESSION_COOKIE_SECRET", "another-secret")
        get_settings.cache_clear()
        assert signed != sign_browser_id("abc")


class TestBrowserCookieName:
    def test_is_plain_where_cookies_may_travel_over_http(self):
        assert browser_cookie_name() == BROWSER_COOKIE_NAME

    def test_carries_the_host_prefix_where_cookies_are_secure(self, monkeypatch):
        # A __Host- cookie can't be planted from a subdomain or over HTTP.
        monkeypatch.setenv("ENVIRONMENT", "production")
        get_settings.cache_clear()
        assert browser_cookie_name() == f"__Host-{BROWSER_COOKIE_NAME}"

    def test_clearing_it_where_secure_is_marked_secure(self, monkeypatch):
        # Browsers ignore an unsecured Set-Cookie for a __Host- name.
        monkeypatch.setenv("ENVIRONMENT", "production")
        get_settings.cache_clear()
        response = Response()
        clear_browser_cookie(response)
        cookie = response.headers["set-cookie"]
        assert cookie.startswith(f"__Host-{BROWSER_COOKIE_NAME}=")
        assert "Secure" in cookie and "Max-Age=0" in cookie


@pytest.mark.asyncio
class TestBindSession:
    async def test_issues_a_browser_id_to_a_browser_without_one(self):
        bindings = FakeBrowserBindings()
        response = Response()

        await bind_session(bindings, {}, response, "s1")

        cookie = response.headers["set-cookie"]
        assert cookie.startswith(f"{BROWSER_COOKIE_NAME}=")
        assert "HttpOnly" in cookie and "SameSite=strict" in cookie
        browser_id = cookie.split(";")[0].split("=", 1)[1]
        assert bindings.bindings == {("s1", sign_browser_id(browser_id))}

    async def test_refreshes_rather_than_replaces_an_existing_id(self):
        response = Response()

        await bind_session(FakeBrowserBindings(), _browser("b1"), response, "s1")

        assert response.headers["set-cookie"].startswith(f"{BROWSER_COOKIE_NAME}=b1;")

    async def test_binding_one_session_leaves_another_bound(self):
        # The fix: a late response binding conversation A can't unbind B.
        bindings = FakeBrowserBindings()
        await bind_session(bindings, _browser("b1"), Response(), "b")

        await bind_session(bindings, _browser("b1"), Response(), "a")

        await require_bound(bindings, _browser("b1"), "a")
        await require_bound(bindings, _browser("b1"), "b")

    async def test_keeps_every_browser_it_is_open_in(self):
        bindings = FakeBrowserBindings()
        await bind_session(bindings, _browser("laptop"), Response(), "s1")
        await bind_session(bindings, _browser("phone"), Response(), "s1")

        await require_bound(bindings, _browser("laptop"), "s1")
        await require_bound(bindings, _browser("phone"), "s1")


@pytest.mark.asyncio
class TestRequireBound:
    @pytest.mark.parametrize("browser_id", [None, "", "other"])
    async def test_refuses_any_browser_not_bound(self, browser_id):
        bindings = FakeBrowserBindings()
        await bind_session(bindings, _browser("b1"), Response(), "s1")
        cookies = {} if browser_id is None else _browser(browser_id)
        with pytest.raises(HTTPException) as exc:
            await require_bound(bindings, cookies, "s1")
        assert exc.value.status_code == 403

    async def test_refuses_a_binding_made_under_another_secret(self, monkeypatch):
        # A binding is only as good as the secret it was signed with; one that
        # doesn't match must never pass, whatever the secret is set to.
        bindings = FakeBrowserBindings()
        await bind_session(bindings, _browser("b1"), Response(), "s1")
        monkeypatch.setenv("SESSION_COOKIE_SECRET", "")
        get_settings.cache_clear()
        with pytest.raises(HTTPException) as exc:
            await require_bound(bindings, _browser("b1"), "s1")
        assert exc.value.status_code == 403
