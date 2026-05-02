"""Build pydantic-ai model instances from the registry."""

from __future__ import annotations

from pydantic_ai.models import Model

from evals.model_registry import ModelEntry, ModelRegistryError


def build_pydantic_ai_model(entry: ModelEntry) -> Model:
    """Construct a pydantic-ai Model from a registry entry."""
    if entry.provider == "anthropic":
        from pydantic_ai.models.anthropic import AnthropicModel
        from pydantic_ai.providers.anthropic import AnthropicProvider

        provider = AnthropicProvider(api_key=entry.api_key)
        return AnthropicModel(entry.model, provider=provider)

    if entry.provider in ("openai", "openai-compatible"):
        from pydantic_ai.models.openai import OpenAIChatModel
        from pydantic_ai.providers.openai import OpenAIProvider

        provider = OpenAIProvider(api_key=entry.api_key, base_url=entry.base_url)
        return OpenAIChatModel(entry.model, provider=provider)

    raise ModelRegistryError(f"unknown provider: {entry.provider}")
