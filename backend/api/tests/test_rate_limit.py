"""Tests for RateLimiter._get_client_key XFF trust gate."""

from unittest.mock import MagicMock, patch

import pytest

from app.core.cache import CacheService
from app.core.rate_limit import RateLimiter


def _make_request(client_host: str, xff: str | None):
    req = MagicMock()
    req.client.host = client_host
    req.headers = {"x-forwarded-for": xff} if xff else {}
    return req


@pytest.fixture
def limiter():
    return RateLimiter(cache=MagicMock(spec=CacheService), requests=10, window=60)


class TestNamespace:
    def test_defaults_to_shared_namespace(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = False
            req = _make_request("10.0.0.1", None)
            assert limiter._get_client_key(req) == "ratelimit:10.0.0.1"

    def test_namespaced_limiters_do_not_share_a_counter(self):
        """
        The submit limiter has a far smaller budget than the general one.

        If both wrote the same Redis key, ordinary polling would burn the
        submission budget and block job launches after a few page loads.
        """
        general = RateLimiter(
            cache=MagicMock(spec=CacheService), requests=100, window=60
        )
        submit = RateLimiter(
            cache=MagicMock(spec=CacheService),
            requests=5,
            window=3600,
            namespace="ratelimit:submit",
        )
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = False
            req = _make_request("10.0.0.1", None)
            assert general._get_client_key(req) != submit._get_client_key(req)
            assert submit._get_client_key(req) == "ratelimit:submit:10.0.0.1"


class TestClientKey:
    def test_uses_client_host_when_xff_not_trusted(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = False
            req = _make_request("10.0.0.1", "1.2.3.4")
            assert limiter._get_client_key(req) == "ratelimit:10.0.0.1"

    def test_uses_xff_leftmost_when_trusted(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = True
            req = _make_request("10.0.0.1", "1.2.3.4, 5.6.7.8")
            assert limiter._get_client_key(req) == "ratelimit:1.2.3.4"

    def test_falls_back_to_client_host_when_trusted_but_no_xff(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = True
            req = _make_request("10.0.0.1", None)
            assert limiter._get_client_key(req) == "ratelimit:10.0.0.1"

    def test_handles_missing_client(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = False
            req = MagicMock()
            req.client = None
            req.headers = {}
            assert limiter._get_client_key(req) == "ratelimit:unknown"

    def test_skips_empty_xff_entries(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = True
            # Leading commas / empty entries used to yield "" and collapse
            # every malformed-header client onto a single rate-limit key.
            req = _make_request("10.0.0.1", ", , 1.2.3.4")
            assert limiter._get_client_key(req) == "ratelimit:1.2.3.4"

    def test_falls_back_when_xff_all_empty(self, limiter):
        with patch("app.core.rate_limit.get_settings") as gs:
            gs.return_value.TRUST_PROXY_HEADERS = True
            req = _make_request("10.0.0.1", ", , ,")
            assert limiter._get_client_key(req) == "ratelimit:10.0.0.1"


def test_principal_key_overrides_ip(limiter):
    request = _make_request("1.2.3.4", None)
    key = limiter._get_client_key(request, principal="user-sub-1")
    assert key == f"{limiter.namespace}:user:user-sub-1"


def test_no_principal_keeps_ip_key(limiter):
    request = _make_request("1.2.3.4", None)
    assert limiter._get_client_key(request) == f"{limiter.namespace}:1.2.3.4"
