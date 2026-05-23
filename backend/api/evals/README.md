# BRC Analytics evals

On-demand evaluation harness for the brc-analytics inference-enabled services.
Mirrors the Galaxy `agent-evals-harness` shape: a thin runner around
`pydantic-evals` with one dataset per evaluation surface.

## Surfaces evaluated

| Dataset                   | Service                             | What it scores                                                                                   |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `search_interpretation`   | `LLMService.interpret_search_query` | NL query -> `DatasetQuery` (taxonomy_id, library_strategy, platform). Deterministic + LLM judge. |
| `tool_selection`          | `AssistantAgent` (single turn)      | Did the agent call the right MCP tool with the right args?                                       |
| `workflow_recommendation` | `LLMService.suggest_workflows`      | Did the model recommend a workflow whose IWC ID is in the accepted set?                          |
| `assistant_multiturn`     | `AssistantAgent` (scripted convo)   | Final accumulated `AnalysisSchema` matches expected fields.                                      |

## Setup

1. `cp evals/models.yaml.sample evals/models.yaml` and fill in real keys
   (or `api_key_env` references). The `judge:` key must point at one of the
   declared models.
2. `uv sync --extra dev` from `backend/api/` to pull in `pydantic-evals`.
3. Export whichever env vars your `models.yaml` references via `api_key_env`
   (e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`). Models with a literal `api_key`
   in YAML don't need an env var. The harness stubs the unused
   `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` so backend init (which reads
   `AI_API_KEY` / `OPENAI_API_KEY` from `Settings`) doesn't crash on startup --
   `_override_model` swaps in the real model immediately after.

## Running

```bash
cd backend/api

# All datasets, all configured models:
python -m evals.run_evals

# A specific dataset / model:
python -m evals.run_evals --datasets search_interpretation --models claude-sonnet-4-6

# Filter to a few cases for fast iteration:
python -m evals.run_evals --datasets tool_selection --only list_yeast_assemblies,off_topic_redirect

# Reduce LLM-noise variance with repeats:
python -m evals.run_evals --datasets search_interpretation --repeat 3
```

Reports land in `evals/results/<date>-<dataset-slug>-<sha>.md`. Commit them:
the diff between runs is "did this prompt change help?".

## Adding a dataset

1. Create `evals/datasets/<name>.py` with a `build(deps, entry, judge_model, only)`
   that returns `(Dataset, task, primary_score_name)`.
2. Register it in `evals/specs.py`.
3. If the dataset needs a new deterministic scorer, add it to `evals/evaluators.py`
   and unit-test it in `evals/tests/test_evaluators.py`.

## Notes

- Not run in CI. Real LLM calls are slow, flaky, and cost money.
- Failures (structural, e.g. schema validation) count as wrong, not as missing.
- `EvalDeps.cache` is a per-run in-memory dict, rebuilt for each `(dataset, model)`
  pair via `with_fresh_cache()`. Multi-turn sessions persist within a run; nothing
  leaks across runs (so `LLMService`'s content-keyed entries can't be served back
  to a different model).
- `--repeat` aggregates by case-name; pydantic-evals appends `[N/M]` to repeated
  case names, which the runner strips before averaging.
- Both the candidate model and the judge come from `models.yaml` -- there's no
  global API-key fallback. Each model is independently addressable.
