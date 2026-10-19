"""Guards on .env.example, which docker-compose loads as its defaults layer."""

from pathlib import Path

ENV_EXAMPLE = Path(__file__).resolve().parents[1] / ".env.example"

# Settings the app reads as "this feature is configured" when non-empty. An
# active placeholder for one of these becomes live config on any deployment
# whose api/.env doesn't override it.
FEATURE_SWITCHES = ("DATABASE_URL", "AI_API_KEY", "OPENAI_API_KEY")


def _active_keys() -> dict[str, str]:
    keys = {}
    for line in ENV_EXAMPLE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        keys[key.strip()] = value.strip()
    return keys


def test_no_feature_switch_is_active():
    active = _active_keys()
    leaked = [k for k in FEATURE_SWITCHES if active.get(k)]
    assert not leaked, f".env.example sets {leaked}; comment them out"
