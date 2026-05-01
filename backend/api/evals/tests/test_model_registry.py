"""Tests for the evals model registry."""

from pathlib import Path

import pytest
import yaml

from evals.model_registry import (
    ModelEntry,
    ModelRegistryError,
    load_registry,
)


@pytest.fixture()
def yaml_path(tmp_path: Path) -> Path:
    data = {
        "judge": "judge-model",
        "models": {
            "judge-model": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-5",
                "base_url": "https://api.anthropic.com",
                "api_key": "sk-test-judge",
            },
            "candidate": {
                "provider": "openai-compatible",
                "model": "Llama-3.3-70B",
                "base_url": "https://example.com/v1",
                "api_key_env": "FAKE_TEST_KEY",
            },
        },
    }
    p = tmp_path / "models.yaml"
    p.write_text(yaml.safe_dump(data))
    return p


def test_load_registry_parses_entries(yaml_path, monkeypatch):
    monkeypatch.setenv("FAKE_TEST_KEY", "sk-test-candidate")
    reg = load_registry(yaml_path)
    assert reg.judge_name == "judge-model"
    assert set(reg.models.keys()) == {"judge-model", "candidate"}
    judge = reg.models["judge-model"]
    assert isinstance(judge, ModelEntry)
    assert judge.api_key == "sk-test-judge"
    cand = reg.models["candidate"]
    assert cand.api_key == "sk-test-candidate"


def test_load_registry_falls_back_to_sample(tmp_path):
    sample = tmp_path / "models.yaml.sample"
    sample.write_text(
        yaml.safe_dump(
            {
                "judge": "x",
                "models": {
                    "x": {
                        "provider": "anthropic",
                        "model": "claude",
                        "base_url": "https://api.anthropic.com",
                        "api_key": "sk-x",
                    }
                },
            }
        )
    )
    reg = load_registry(tmp_path / "models.yaml")
    assert reg.judge_name == "x"


def test_missing_api_key_raises_only_when_resolved(tmp_path, monkeypatch):
    """Loading the registry should NOT eagerly resolve keys for every model.

    A user running --models foo shouldn't be blocked by a stale entry whose
    env var they never set.
    """
    monkeypatch.delenv("UNSET_KEY", raising=False)
    monkeypatch.setenv("USED_KEY", "sk-ok")
    p = tmp_path / "models.yaml"
    p.write_text(
        yaml.safe_dump(
            {
                "judge": "ok",
                "models": {
                    "ok": {
                        "provider": "anthropic",
                        "model": "c",
                        "base_url": "https://api.anthropic.com",
                        "api_key_env": "USED_KEY",
                    },
                    "broken": {
                        "provider": "anthropic",
                        "model": "c",
                        "base_url": "https://api.anthropic.com",
                        "api_key_env": "UNSET_KEY",
                    },
                },
            }
        )
    )
    # Loading succeeds even though "broken" has an unresolved key.
    reg = load_registry(p)
    # Filtering to "ok" only doesn't raise.
    assert reg.filter(["ok"])["ok"].api_key == "sk-ok"
    # Asking for "broken" surfaces the missing env var.
    with pytest.raises(ModelRegistryError, match="UNSET_KEY"):
        reg.filter(["broken"])
    # The judge happens to be "ok" so resolution succeeds.
    assert reg.judge.api_key == "sk-ok"


def test_filter_models(yaml_path, monkeypatch):
    monkeypatch.setenv("FAKE_TEST_KEY", "k")
    reg = load_registry(yaml_path)
    filtered = reg.filter(["candidate"])
    assert set(filtered.keys()) == {"candidate"}
    with pytest.raises(ModelRegistryError, match="unknown"):
        reg.filter(["does-not-exist"])
