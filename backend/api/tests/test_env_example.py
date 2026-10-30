"""Guards on .env.example, which docker-compose loads as its defaults layer."""

from pathlib import Path

from dotenv import dotenv_values

ENV_EXAMPLE = Path(__file__).resolve().parents[1] / ".env.example"

# Settings the app reads as "this feature is configured" when non-empty. An
# active placeholder for one of these becomes live config on any deployment
# whose api/.env doesn't override it.
FEATURE_SWITCHES = (
    "DATABASE_URL",
    "AI_API_KEY",
    "OPENAI_API_KEY",
    "GALAXY_API_KEY",
    "SENTRY_DSN",
    "SRA_MIRROR_PATH",
    "KMINDEX_EXPORT_DIR",
)


def test_no_feature_switch_is_active():
    active = dotenv_values(ENV_EXAMPLE, interpolate=False)
    leaked = [k for k in FEATURE_SWITCHES if active.get(k)]
    assert not leaked, f".env.example sets {leaked}; comment them out"
