"""Load and filter the evals model registry from YAML."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

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
class _PendingEntry:
    """Registry entry with key resolution deferred until filter time."""

    name: str
    provider: str
    model: str
    base_url: str
    api_key_inline: Optional[str]
    api_key_env: Optional[str]

    def referenced_env_vars(self) -> list[str]:
        return [self.api_key_env] if self.api_key_env else []

    def resolve(self) -> ModelEntry:
        if self.api_key_inline:
            return ModelEntry(
                name=self.name,
                provider=self.provider,
                model=self.model,
                base_url=self.base_url,
                api_key=self.api_key_inline,
            )
        if self.api_key_env:
            val = os.environ.get(self.api_key_env)
            if not val:
                raise ModelRegistryError(
                    f"model '{self.name}' references env var {self.api_key_env}, "
                    "but it is unset"
                )
            return ModelEntry(
                name=self.name,
                provider=self.provider,
                model=self.model,
                base_url=self.base_url,
                api_key=val,
            )
        raise ModelRegistryError(
            f"model '{self.name}' has neither api_key nor api_key_env set"
        )


@dataclass(frozen=True)
class ModelRegistry:
    """Pending registry. Keys are resolved only when models are filtered in.

    This avoids two failure modes the harness used to have:
    1. An unused model with a missing key blocking a filtered single-model run.
    2. A stub key (set by ensure_init_env) silently masquerading as the real
       eval key.
    """

    judge_name: str
    pending: dict[str, _PendingEntry]

    @property
    def models(self) -> dict[str, ModelEntry]:
        """Resolve every entry. Use sparingly -- prefer filter()."""
        return {name: p.resolve() for name, p in self.pending.items()}

    @property
    def judge(self) -> ModelEntry:
        if self.judge_name not in self.pending:
            raise ModelRegistryError(f"judge '{self.judge_name}' not found in models")
        return self.pending[self.judge_name].resolve()

    def referenced_env_vars(self) -> set[str]:
        """Every env var any entry uses for its api_key."""
        out: set[str] = set()
        for p in self.pending.values():
            out.update(p.referenced_env_vars())
        return out

    def filter(self, names: Iterable[str]) -> dict[str, ModelEntry]:
        names = list(names)
        unknown = [n for n in names if n not in self.pending]
        if unknown:
            raise ModelRegistryError(f"unknown model(s): {unknown}")
        return {n: self.pending[n].resolve() for n in names}


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

    entries: dict[str, _PendingEntry] = {}
    for name, spec in raw["models"].items():
        for required in ("provider", "model", "base_url"):
            if required not in spec:
                raise ModelRegistryError(
                    f"model '{name}' missing required field '{required}'"
                )
        entries[name] = _PendingEntry(
            name=name,
            provider=spec["provider"],
            model=spec["model"],
            base_url=spec["base_url"],
            api_key_inline=str(spec["api_key"]) if spec.get("api_key") else None,
            api_key_env=spec.get("api_key_env"),
        )

    judge = raw.get("judge")
    if not judge:
        raise ModelRegistryError(f"{path} missing top-level 'judge' key")

    return ModelRegistry(judge_name=judge, pending=entries)
