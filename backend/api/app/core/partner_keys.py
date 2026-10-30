"""API keys and sunset date for the temporary partner API.

Only hashes are configured. PARTNER_API_KEYS is a comma-separated list of
`partner_id:key_id:sha256hex` entries: partner_id is the stable identity that
budgets, histories and analytics hang off, key_id names one key so it can be
rotated or revoked without changing who the partner is. Keys are 32 random
bytes, which is what makes an unsalted sha256 an adequate thing to store.
"""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
from typing import Optional

_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
_DIGEST_PATTERN = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class PartnerKey:
    """One configured key: whose it is, its name, and its sha256."""

    digest: str
    key_id: str
    partner_id: str


@dataclass(frozen=True)
class Partner:
    """The caller an accepted key identifies."""

    key_id: str
    partner_id: str


def hash_partner_key(key: str) -> str:
    """
    The digest a key is configured by.

    @param key: the plaintext key, as the partner sends it.
    @returns: lowercase sha256 hex.
    """
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def generate_partner_key() -> str:
    """
    A new key: 32 random bytes, urlsafe.

    @returns: the plaintext key, to hand to the partner once and not store.
    """
    return secrets.token_urlsafe(32)


def parse_partner_keys(raw: str) -> tuple[PartnerKey, ...]:
    """
    Parse PARTNER_API_KEYS, refusing anything malformed.

    A typo here would otherwise surface as every partner request getting a 401,
    which reads as their bug rather than our config.

    @param raw: the env value.
    @returns: the configured keys.
    """
    keys: list[PartnerKey] = []
    seen: set[tuple[str, str]] = set()
    digests: set[str] = set()
    for entry in (e.strip() for e in raw.split(",")):
        if not entry:
            continue
        parts = entry.split(":")
        if len(parts) != 3:
            raise ValueError(
                "PARTNER_API_KEYS entries must be partner_id:key_id:sha256hex"
            )
        partner_id, key_id, digest = (p.strip() for p in parts)
        digest = digest.lower()
        if not _ID_PATTERN.match(partner_id) or not _ID_PATTERN.match(key_id):
            raise ValueError(
                "PARTNER_API_KEYS ids must be lowercase letters, digits and dashes"
            )
        if not _DIGEST_PATTERN.match(digest):
            raise ValueError("PARTNER_API_KEYS digests must be 64 hex characters")
        # A key_id names one of a partner's keys, so two partners can both
        # rotate to "2026-09" without colliding.
        if (partner_id, key_id) in seen:
            raise ValueError(
                f"PARTNER_API_KEYS repeats key_id {key_id!r} for {partner_id!r}"
            )
        seen.add((partner_id, key_id))
        # One key must name one partner, or whichever entry matched last would
        # decide whose budget, history and analytics a request lands in.
        if digest in digests:
            raise ValueError("PARTNER_API_KEYS lists the same key twice")
        digests.add(digest)
        keys.append(PartnerKey(digest=digest, key_id=key_id, partner_id=partner_id))
    return tuple(keys)


def match_partner_key(
    presented: Optional[str], keys: tuple[PartnerKey, ...]
) -> Optional[Partner]:
    """
    Find the configured key a presented key hashes to.

    Every entry is compared, in constant time, whether or not an earlier one
    matched, so timing says nothing about which or how many keys exist.

    @param presented: the X-API-Key header, if any.
    @param keys: the configured keys.
    @returns: the partner, or None.
    """
    if not presented:
        return None
    digest = hash_partner_key(presented)
    found: Optional[Partner] = None
    for key in keys:
        if hmac.compare_digest(digest, key.digest):
            found = Partner(key_id=key.key_id, partner_id=key.partner_id)
    return found


def parse_sunset(raw: str) -> Optional[datetime]:
    """
    Parse PARTNER_API_SUNSET: an ISO date or datetime, taken as UTC.

    A bare date means the start of that day, so "2027-03-31" switches the API
    off as that day begins.

    @param raw: the env value; empty means no sunset.
    @returns: an aware UTC datetime, or None.
    """
    raw = raw.strip()
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        try:
            parsed = datetime.combine(date.fromisoformat(raw), time())
        except ValueError as e:
            raise ValueError(
                f"PARTNER_API_SUNSET must be an ISO date or datetime, got {raw!r}"
            ) from e
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def sunset_header(sunset: datetime) -> str:
    """
    The Sunset header value (RFC 8594), which must be an HTTP-date.

    @param sunset: when the API goes away.
    @returns: e.g. "Wed, 31 Mar 2027 00:00:00 GMT".
    """
    return format_datetime(sunset, usegmt=True)
