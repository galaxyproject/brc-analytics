"""MCP requests are charged to the same budgets as the HTTP routes."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core import dependencies
from app.core.partner_keys import generate_partner_key, hash_partner_key
from tests.test_mcp import _make_app

KEY = generate_partner_key()
SUNSET = (datetime.now(timezone.utc) + timedelta(days=90)).replace(microsecond=0)
INIT = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "pytest", "version": "1"},
    },
}
ACCEPT = {"Accept": "application/json, text/event-stream"}


@pytest.fixture()
def limiters(tmp_path, monkeypatch):
    monkeypatch.setenv("PARTNER_API_ENABLED", "true")
    monkeypatch.setenv("PARTNER_API_KEYS", f"acme:k1:{hash_partner_key(KEY)}")
    monkeypatch.setenv("PARTNER_API_SUNSET", SUNSET.isoformat())
    monkeypatch.setenv("GALAXY_API_KEY", "service-key")
    app = _make_app(tmp_path, monkeypatch)
    general = MagicMock()
    general.check = AsyncMock(return_value={})
    partner = MagicMock()
    partner.check = AsyncMock(return_value={})
    monkeypatch.setattr(
        dependencies, "get_rate_limiter", MagicMock(return_value=general)
    )
    monkeypatch.setattr(
        dependencies, "get_partner_rate_limiter", MagicMock(return_value=partner)
    )
    return app, general, partner


def test_anonymous_mcp_request_is_charged_to_the_shared_pool(limiters):
    app, general, partner = limiters
    with TestClient(app) as client:
        response = client.post("/api/v1/mcp/", json=INIT, headers=ACCEPT)
    assert response.status_code == 200
    general.check.assert_awaited_once()
    assert general.check.await_args.kwargs.get("principal") is None
    partner.check.assert_not_awaited()


def test_partner_key_charges_the_partner_budget(limiters):
    app, general, partner = limiters
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/mcp/", json=INIT, headers={**ACCEPT, "X-API-Key": KEY}
        )
    assert response.status_code == 200
    partner.check.assert_awaited_once()
    assert partner.check.await_args.kwargs["principal"] == "acme"
    general.check.assert_not_awaited()


def test_unknown_key_falls_back_to_the_shared_pool(limiters):
    app, general, partner = limiters
    with TestClient(app) as client:
        client.post("/api/v1/mcp/", json=INIT, headers={**ACCEPT, "X-API-Key": "nope"})
    general.check.assert_awaited_once()
    partner.check.assert_not_awaited()


def test_spent_budget_answers_429_before_the_mcp_app(limiters):
    app, general, _ = limiters
    general.check.side_effect = HTTPException(
        status_code=429, detail="over", headers={"Retry-After": "30"}
    )
    with TestClient(app) as client:
        response = client.post("/api/v1/mcp/", json=INIT, headers=ACCEPT)
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "30"


def test_slashless_path_is_still_charged(limiters):
    app, general, _ = limiters
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/mcp", json=INIT, headers=ACCEPT, follow_redirects=False
        )
    assert response.status_code == 200
    general.check.assert_awaited_once()
