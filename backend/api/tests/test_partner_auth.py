"""Partner API keys: parsing, matching, the sunset, and the budgets."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core import dependencies
from app.core.config import Settings, get_settings
from app.core.partner_keys import (
    Partner,
    generate_partner_key,
    hash_partner_key,
    match_partner_key,
    parse_partner_keys,
    parse_sunset,
    sunset_header,
)
from app.core.rate_limit import RateLimiter

KEY = generate_partner_key()
OTHER_KEY = generate_partner_key()
ENTRY = f"example-partner:k1:{hash_partner_key(KEY)}"


class TestParsing:
    def test_entries_parse(self):
        [key] = parse_partner_keys(f" {ENTRY} ,")

        assert (key.partner_id, key.key_id) == ("example-partner", "k1")

    def test_empty_means_no_keys(self):
        assert parse_partner_keys("") == ()

    @pytest.mark.parametrize(
        "raw",
        [
            "example-partner:" + "a" * 64,
            "Logan:k1:" + "a" * 64,
            "logan:k1:" + "a" * 63,
            "logan:k1:" + "g" * 64,
            f"a:k1:{'a' * 64},a:k1:{'b' * 64}",
            f"a:k1:{'a' * 64},b:k2:{'a' * 64}",
        ],
    )
    def test_malformed_entries_are_refused(self, raw):
        with pytest.raises(ValueError):
            parse_partner_keys(raw)

    def test_two_partners_can_share_a_key_id(self):
        keys = parse_partner_keys(f"a:2026-09:{'a' * 64},b:2026-09:{'b' * 64}")

        assert {(k.partner_id, k.key_id) for k in keys} == {
            ("a", "2026-09"),
            ("b", "2026-09"),
        }

    def test_a_generated_key_has_the_entropy_the_hash_relies_on(self):
        assert len(generate_partner_key()) >= 43


class TestMatching:
    def test_the_right_key_identifies_the_partner(self):
        keys = parse_partner_keys(ENTRY)

        assert match_partner_key(KEY, keys) == Partner(
            key_id="k1", partner_id="example-partner"
        )

    @pytest.mark.parametrize("presented", [None, "", "not-a-key"])
    def test_anything_else_identifies_no_one(self, presented):
        assert match_partner_key(presented, parse_partner_keys(ENTRY)) is None

    def test_a_rotated_key_still_resolves_to_the_same_partner(self):
        keys = parse_partner_keys(
            f"{ENTRY},example-partner:k2:{hash_partner_key(OTHER_KEY)}"
        )

        assert match_partner_key(OTHER_KEY, keys).partner_id == "example-partner"


class TestSunset:
    def test_a_bare_date_is_the_start_of_that_day_utc(self):
        assert parse_sunset("2027-03-31") == datetime(2027, 3, 31, tzinfo=timezone.utc)

    def test_empty_is_no_sunset(self):
        assert parse_sunset("") is None

    def test_garbage_is_refused(self):
        with pytest.raises(ValueError):
            parse_sunset("next spring")

    def test_the_header_is_an_http_date(self):
        assert (
            sunset_header(datetime(2027, 3, 31, tzinfo=timezone.utc))
            == "Wed, 31 Mar 2027 00:00:00 GMT"
        )


class TestSettings:
    def test_enabled_without_keys_refuses_to_start(self, monkeypatch):
        monkeypatch.setenv("PARTNER_API_ENABLED", "true")
        monkeypatch.setenv("PARTNER_API_SUNSET", "2027-03-31")
        monkeypatch.delenv("PARTNER_API_KEYS", raising=False)

        with pytest.raises(ValueError, match="PARTNER_API_KEYS"):
            Settings()

    def test_enabled_without_a_sunset_refuses_to_start(self, monkeypatch):
        monkeypatch.setenv("PARTNER_API_ENABLED", "true")
        monkeypatch.setenv("PARTNER_API_KEYS", ENTRY)
        monkeypatch.delenv("PARTNER_API_SUNSET", raising=False)

        with pytest.raises(ValueError, match="PARTNER_API_SUNSET"):
            Settings()

    def test_disabled_is_the_default(self, monkeypatch):
        monkeypatch.delenv("PARTNER_API_ENABLED", raising=False)

        assert Settings().PARTNER_API_ENABLED is False


@pytest.fixture()
def partner_app(monkeypatch):
    """An app with one route behind get_partner, and counting limiters."""
    monkeypatch.setenv("PARTNER_API_KEYS", ENTRY)
    monkeypatch.setenv(
        "PARTNER_API_SUNSET",
        (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
    )
    get_settings.cache_clear()
    dependencies.reset_all_services()

    general = MagicMock()
    general.check = AsyncMock(return_value={})
    submit = MagicMock()
    submit.check = AsyncMock(return_value={})
    monkeypatch.setattr(
        dependencies, "get_partner_rate_limiter", MagicMock(return_value=general)
    )
    monkeypatch.setattr(
        dependencies, "get_partner_submit_rate_limiter", MagicMock(return_value=submit)
    )

    app = FastAPI()

    @app.get("/who")
    async def who(partner: Partner = Depends(dependencies.get_partner)):
        return {"partner": partner.partner_id}

    @app.post("/submit")
    async def submit_route(
        _limit=Depends(dependencies.check_partner_submit_rate_limit),
    ):
        return {}

    yield TestClient(app), general, submit
    get_settings.cache_clear()
    dependencies.reset_all_services()


class TestDependency:
    def test_a_good_key_gets_through_and_is_charged_to_the_partner(self, partner_app):
        client, general, _ = partner_app

        response = client.get("/who", headers={"X-API-Key": KEY})

        assert response.json() == {"partner": "example-partner"}
        assert general.check.await_args.kwargs["principal"] == "example-partner"

    @pytest.mark.parametrize("headers", [{}, {"X-API-Key": "wrong"}])
    def test_no_key_or_a_bad_one_is_401(self, partner_app, headers):
        client, general, _ = partner_app

        assert client.get("/who", headers=headers).status_code == 401
        general.check.assert_not_awaited()

    def test_past_the_sunset_everything_is_410(self, partner_app, monkeypatch):
        client, _, _ = partner_app
        monkeypatch.setenv("PARTNER_API_SUNSET", "2020-01-01")
        get_settings.cache_clear()

        assert client.get("/who", headers={"X-API-Key": KEY}).status_code == 410
        assert client.get("/who").status_code == 410

    def test_a_submit_spends_both_budgets(self, partner_app):
        client, general, submit = partner_app

        client.post("/submit", headers={"X-API-Key": KEY})

        general.check.assert_awaited_once()
        assert submit.check.await_args.kwargs["principal"] == "example-partner"


def test_partner_budgets_do_not_share_a_counter_with_anyone(monkeypatch):
    get_settings.cache_clear()
    dependencies.reset_all_services()
    monkeypatch.setattr(
        dependencies, "get_cache_service", MagicMock(return_value=MagicMock())
    )

    namespaces = {
        dependencies.get_rate_limiter().namespace,
        dependencies.get_submit_rate_limiter().namespace,
        dependencies.get_user_submit_rate_limiter().namespace,
        dependencies.get_partner_rate_limiter().namespace,
        dependencies.get_partner_submit_rate_limiter().namespace,
    }

    assert len(namespaces) == 5
    assert isinstance(dependencies.get_partner_rate_limiter(), RateLimiter)
    dependencies.reset_all_services()
