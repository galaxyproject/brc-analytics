"""Load and filter the evals model registry from YAML."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import yaml


class ModelRegistryError(RuntimeError):
    """Raised when the registry can't be parsed or a key is missing."""


@dataclass(frozen=True)
class ModelEntry:
    name: str
    provider: str  # "anthropic" | "openai" | "openai-compatible"
    model: str
    base_url: str
    api_key: str


@dataclass(frozen=True)
class ModelRegistry:
    judge_name: str
    models: dict[str, ModelEntry]

    @property
    def judge(self) -> ModelEntry:
        if self.judge_name not in self.models:
            raise ModelRegistryError(f"judge '{self.judge_name}' not found in models")
        return self.models[self.judge_name]

    def filter(self, names: Iterable[str]) -> dict[str, ModelEntry]:
        names = list(names)
        unknown = [n for n in names if n not in self.models]
        if unknown:
            raise ModelRegistryError(f"unknown model(s): {unknown}")
        return {n: self.models[n] for n in names}


def _resolve_api_key(name: str, raw: dict) -> str:
    if "api_key" in raw and raw["api_key"]:
        return str(raw["api_key"])
    env_var = raw.get("api_key_env")
    if not env_var:
        raise ModelRegistryError(
            f"model '{name}' has neither api_key nor api_key_env set"
        )
    val = os.environ.get(env_var)
    if not val:
        raise ModelRegistryError(
            f"model '{name}' references env var {env_var}, but it is unset"
        )
    return val


def load_registry(path: Path) -> ModelRegistry:
    """Load the model registry from `path`, falling back to `<path>.sample`."""
    if not path.exists():
        sample = path.with_suffix(path.suffix + ".sample")
        if sample.exists():
            path = sample
        else:
            raise ModelRegistryError(f"no models.yaml found at {path}")

    raw = yaml.safe_load(path.read_text()) or {}
    if "models" not in raw:
        raise ModelRegistryError(f"{path} missing top-level 'models' key")

    entries: dict[str, ModelEntry] = {}
    for name, spec in raw["models"].items():
        for required in ("provider", "model", "base_url"):
            if required not in spec:
                raise ModelRegistryError(
                    f"model '{name}' missing required field '{required}'"
                )
        entries[name] = ModelEntry(
            name=name,
            provider=spec["provider"],
            model=spec["model"],
            base_url=spec["base_url"],
            api_key=_resolve_api_key(name, spec),
        )

    judge = raw.get("judge")
    if not judge:
        raise ModelRegistryError(f"{path} missing top-level 'judge' key")

    return ModelRegistry(judge_name=judge, models=entries)
