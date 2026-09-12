"""Scrubbing shared by the fail-open writers that persist chat content."""

from __future__ import annotations


def strip_nuls(value):
    """Remove NUL characters, which Postgres rejects in text and jsonb.

    A NUL is legal in a Python str and in JSON, so a user can paste one into
    the chat box and -- because these writers are fail-open -- silently keep
    the whole row out of the database. Scrubbing beats losing the row.
    """
    if isinstance(value, str):
        return value.replace("\x00", "")
    if isinstance(value, dict):
        return {strip_nuls(k): strip_nuls(v) for k, v in value.items()}
    if isinstance(value, list):
        return [strip_nuls(v) for v in value]
    return value
