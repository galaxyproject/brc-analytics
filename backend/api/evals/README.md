# BRC Analytics evals

On-demand evaluation harness for the brc-analytics inference-enabled services.
Mirrors the Galaxy `agent-evals-harness` shape: a thin runner around
`pydantic-evals` with one dataset per evaluation surface.

## Surfaces evaluated

| Dataset                   | Service                             | What it scores                                                                                                                 |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `search_interpretation`   | `LLMService.interpret_search_query` | NL query -> `DatasetQuery` (taxonomy_id, library_strategy, platform). Deterministic + LLM judge.                               |
| `tool_selection`          | `AssistantAgent` (single turn)      | Did the agent call the right MCP tool with the right args?                                                                     |
| `workflow_recommendation` | `LLMService.suggest_workflows`      | Did the model recommend a workflow whose IWC ID is in the accepted set?                                                        |
| `assistant_multiturn`     | `AssistantAgent` (scripted convo)   | Final accumulated `AnalysisSchema` matches expected fields.                                                                    |
| `structured_channel`      | `AssistantAgent` (scripted convo)   | Per-model reply/extract production, capture-on-change, no-leak, and tracker-correctness for the extraction-pass state capture. |
| `logan_grounding`         | `AssistantAgent` (Logan session)    | Does a reply about a Logan search use the cohort's own numbers and caveats? Primary score `NumbersTraceToContext`.             |
| `logan_multiturn`         | `AssistantAgent` (Logan session)    | Does "use the top N runs" hand off the right N accessions?                                                                     |

## `structured_channel` -- the MiniMax make-or-break

The assistant captures tracker state with an **extraction pass**: the
conversational reply is plain text, and a separate, focused call extracts the
tracker snapshot (see the state-capture decision record in `results/`). What
varies per model -- and what this dataset measures over scripted multi-turn
scenarios (build a decision, switch one, clear a field, drive toward handoff,
pure exploration, and an offered-not-committed regression) -- is whether the
endpoint reliably produces both calls and captures the right state:

- `ExtractSuccessRate` (primary) -- of turns that got a reply, how many the
  extractor produced a snapshot for (a stack that 400s on structured output
  can't run it).
- `ReplySuccessRate` -- the conversational call is plain text, so this should be
  ~1.0; a low value means the endpoint itself is flaky.
- `CaptureOnChange` -- of turns that should change state, how many the extractor
  produced a NON-EMPTY snapshot for (a completeness signal, not a correctness
  check -- `FinalSchemaContains` is the correctness one).
- `NoLeak` -- must be 1.0: no state trailer in any user-visible reply.
- `FinalSchemaContains` / `SchemaFieldEmpty` / `IsCompleteEquals` -- end-state
  correctness (fields present, cleared/uncommitted fields empty, handoff
  readiness).

Go/no-go, per model: reply + extract production at/near 1.0 with capture holding
means the model can run the extraction pass; a low extract rate means its
endpoint can't produce constrained output (investigate guided decoding). Run it
against the primary target with:

```bash
cd backend/api
AI_PRIMARY_MODEL=MiniMax-M2.7 python -m evals.run_evals \
  --datasets structured_channel --models MiniMax-M2.7 --repeat 3
```

Add `gpt-oss-120b-tacc,claude-sonnet-4-6` to `--models` to compare the
secondary target and the strong-model control. (Meta-Llama-3.3-70B is out of
scope -- its TACC serving stack was incompatible with the earlier tool+trailer
design.)

## Logan sessions and the numbers check

The Logan datasets open a session from a captured search (a fixture under
`datasets/fixtures/`, with its README) and serve every Galaxy read from those
files, so no run touches the network for Logan data. New fixtures come from
`scripts/capture_logan_fixture.py`, which captures a finished search from a
deployment, trims its export to fit in the repo, and can derive variants
(`--derive saturated|no_mirror|injected --from <name> <new>`).

`NumbersTraceToContext` scores the fraction of a reply's numbers that trace
to what the model was given: every turn's instructions, the intro message, the
user's own words and every tool return. Its rules, all tested in
`evals/tests/test_evaluators.py`:

- A percentage traces to a context percentage, or its complement (100 - x),
  **within 0.1 and no further**. Rounding to a whole percent does not count:
  "97%" for 97.2% is untraced, on purpose, since 12% for 12.49% would pass
  otherwise.
- A bare integer is a count, and traces only to a count: exactly, or for a
  count of 1,000 or more, stated to at least two leading digits (17.6k, 17,600
  or 18,000 for 17,629; never 20,000).
- An unsigned decimal traces to a decimal it restates or rounds (0.97 for
  0.972), or to a percentage within 0.1.
- Digits in identifiers are not numbers: accessions, job ids, URLs, ISO dates,
  list and table-rank ordinals, rRNA names ("18 S"). Numbers with units ("999ms",
  "4GiB", "30x") or exponents are quantities.

Numbers a model derives itself (a difference, a share it computed) are
untraced by design: that is where errors hide.

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

# Keep every case's output and scores as JSONL for re-scoring later, cap the
# cases in flight on a shared endpoint, and label what this run varies:
python -m evals.run_evals --datasets logan_grounding --repeat 3 \
  --dump-dir /tmp/dumps --max-concurrency 6 --label prompt-v2
```

`--dump-dir` writes one `<dataset>@<model>[@<label>].jsonl` per run (never over
an earlier file) with each case's reply, trace and scores, so a scorer change
can be re-scored from saved replies without calling a model again.
`--max-concurrency` caps cases in flight; lower it when latency is what is
being measured.

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
