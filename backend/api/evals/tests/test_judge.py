"""Tests for judge / model construction."""

from evals.judge import build_pydantic_ai_model
from evals.model_registry import ModelEntry


def test_anthropic_model():
    entry = ModelEntry(
        name="c",
        provider="anthropic",
        model="claude-sonnet-4-5",
        base_url="https://api.anthropic.com",
        api_key="sk-fake",
    )
    model = build_pydantic_ai_model(entry)
    from pydantic_ai.models.anthropic import AnthropicModel

    assert isinstance(model, AnthropicModel)


def test_openai_compatible_model():
    entry = ModelEntry(
        name="o",
        provider="openai-compatible",
        model="meta-llama/Llama-3.3-70B-Instruct",
        base_url="https://example.com/v1",
        api_key="sk-fake",
    )
    model = build_pydantic_ai_model(entry)
    from pydantic_ai.models.openai import OpenAIChatModel

    assert isinstance(model, OpenAIChatModel)
