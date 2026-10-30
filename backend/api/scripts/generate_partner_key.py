#!/usr/bin/env python3
"""Mint a partner API key.

    python -m scripts.generate_partner_key example-partner 2026-09

Prints the plaintext key once -- hand it to the partner and don't keep it --
and the PARTNER_API_KEYS entry to put in the vault, which holds only its hash.
"""

import argparse

from app.core.partner_keys import (
    generate_partner_key,
    hash_partner_key,
    parse_partner_keys,
)


def main() -> None:
    """Print a new key and its config entry."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("partner_id", help="stable partner name, e.g. example-partner")
    parser.add_argument("key_id", help="name for this key, e.g. 2026-09")
    args = parser.parse_args()

    key = generate_partner_key()
    entry = f"{args.partner_id}:{args.key_id}:{hash_partner_key(key)}"
    # Same validation the backend applies at startup.
    parse_partner_keys(entry)

    print(f"Key for the partner (shown once):\n  {key}\n")
    print(f"PARTNER_API_KEYS entry:\n  {entry}")


if __name__ == "__main__":
    main()
