"""CLI runner for the brc-analytics evals harness.

Examples:
  python -m evals.run_evals --datasets tool_selection
  python -m evals.run_evals --datasets all --models claude-sonnet-4-6,gpt-5
  python -m evals.run_evals --datasets tool_selection --repeat 3
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as _dt
import logging
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

from pydantic_evals.evaluators import LLMJudge

from evals.judge import build_pydantic_ai_model
from evals.model_registry import load_registry
from evals.report import RunResult, render_report
from evals.specs import SPECS
from evals.tasks import build_deps

logger = logging.getLogger("evals")


@dataclass
class _ScoredCase:
    name: str
    scores: dict[str, float]


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], text=True
        ).strip()
    except Exception:
        return "unknown"


def _strip_repeat_suffix(name: str) -> str:
    # pydantic-evals appends [N/M] when --repeat is used
    return re.sub(r"\s*\[\d+/\d+\]$", "", name)


def _split_csv(value: str) -> list[str]:
    return [x.strip() for x in value.split(",")]


def _score_value(scores_obj) -> float:
    """Pull numeric value out of a pydantic-evals score dict entry."""
    if scores_obj is None:
        return 0.0
    val = getattr(scores_obj, "value", scores_obj)
    if isinstance(val, bool):
        return 1.0 if val else 0.0
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def _llm_judge_output_names(evaluator) -> list[str] | None:
    """Return exact output names for pydantic-evals LLMJudge, if applicable."""
    if not isinstance(evaluator, LLMJudge):
        return None

    evaluation_name = evaluator.get_default_evaluation_name()
    score = getattr(evaluator, "score", False)
    assertion = getattr(evaluator, "assertion", False)
    include_both = score is not False and assertion is not False

    names: list[str] = []
    if score is not False:
        default_name = f"{evaluation_name}_score" if include_both else evaluation_name
        override = score.get("evaluation_name") if isinstance(score, dict) else None
        names.append(override or default_name)
    if assertion is not False:
        default_name = f"{evaluation_name}_pass" if include_both else evaluation_name
        override = (
            assertion.get("evaluation_name") if isinstance(assertion, dict) else None
        )
        names.append(override or default_name)
    return names


def _dedupe_name(name: str, seen: set[str]) -> str:
    """Match pydantic-evals duplicate evaluator suffixing."""
    if name not in seen:
        seen.add(name)
        return name
    suffix = 2
    while f"{name}_{suffix}" in seen:
        suffix += 1
    deduped = f"{name}_{suffix}"
    seen.add(deduped)
    return deduped


def _declared_evaluator_names(case, dataset_evaluators) -> frozenset[str]:
    """Names that would be emitted if this case's evaluators had run.

    pydantic-evals appends `_2`, `_3`, ... for duplicate evaluator output names.
    Structural failures skip evaluator execution, so reproduce that naming here
    to keep report denominators honest.
    """
    seen: set[str] = set()
    names: list[str] = []
    evaluators = list(getattr(case, "evaluators", []) or []) + list(
        dataset_evaluators or []
    )
    for evaluator in evaluators:
        output_names = _llm_judge_output_names(evaluator)
        if output_names is None:
            output_names = [evaluator.get_default_evaluation_name()]
        for name in output_names:
            names.append(_dedupe_name(name, seen))
    return frozenset(names)


async def _run_one(
    dataset_name: str,
    model_name: str,
    deps,
    entry,
    judge_model,
    only: list[str] | None,
    repeat: int,
) -> RunResult:
    build = SPECS[dataset_name]
    # Fresh cache per run so LLMService's content-keyed entries can't be served
    # back to a different model. Multi-turn sessions still work because session
    # ids are minted fresh per case within the run.
    run_deps = deps.with_fresh_cache()
    dataset, task, primary_score = build(run_deps, entry, judge_model, only)

    started = time.time()
    report = await dataset.evaluate(
        task,
        name=f"{dataset_name}@{model_name}",
        repeat=repeat,
        progress=False,
    )
    elapsed = time.time() - started

    aggregated: dict[str, dict[str, list[float]]] = {}
    for case in report.cases:
        key = _strip_repeat_suffix(case.name)
        bucket = aggregated.setdefault(key, {})
        # Pull from both scores and assertions so any evaluator type is captured.
        for ev_name, val in {**case.scores, **case.assertions}.items():
            bucket.setdefault(ev_name, []).append(_score_value(val))

    cases = [
        _ScoredCase(
            name=name,
            scores={ev: sum(vals) / len(vals) for ev, vals in scores.items()},
        )
        for name, scores in aggregated.items()
    ]

    # Map case name -> declared evaluator class names so structural failures
    # only count toward denominators of evaluators that were actually in scope.
    case_evaluators: dict[str, frozenset[str]] = {
        c.name: _declared_evaluator_names(c, dataset.evaluators) for c in dataset.cases
    }
    failures = []
    for f in getattr(report, "failures", []):
        case_name = _strip_repeat_suffix(f.name)
        failures.append(
            (
                case_name,
                str(f.error_message)[:200],
                case_evaluators.get(case_name, frozenset()),
            )
        )
    return RunResult(
        dataset=dataset_name,
        model=model_name,
        cases=cases,
        failures=failures,
        primary_score=primary_score,
        duration_seconds=elapsed,
    )


async def _amain(args) -> int:
    # Load the registry FIRST so its env-var references take precedence over
    # the stub keys ensure_init_env() sets for AssistantAgent's eager init.
    # If we did this in the other order, a registry entry with
    # `api_key_env: ANTHROPIC_API_KEY` could silently pick up the stub key.
    registry = load_registry(Path(args.config))
    referenced = registry.referenced_env_vars()
    deps = build_deps(skip_env_vars=referenced)
    judge_model = build_pydantic_ai_model(registry.judge)

    dataset_names = list(SPECS) if args.datasets == "all" else _split_csv(args.datasets)
    unknown_ds = [d for d in dataset_names if d not in SPECS]
    if unknown_ds:
        raise SystemExit(f"unknown dataset(s): {unknown_ds}")

    wanted = (
        registry.filter(_split_csv(args.models)) if args.models else registry.models
    )
    only = _split_csv(args.only) if args.only else None

    runs: list[RunResult] = []
    for dataset_name in dataset_names:
        for model_name, entry in wanted.items():
            logger.info("running %s on %s", dataset_name, model_name)
            run = await _run_one(
                dataset_name, model_name, deps, entry, judge_model, only, args.repeat
            )
            runs.append(run)

    sha = _git_sha()
    md = render_report(runs, sha=sha)

    if args.output:
        out_path = Path(args.output)
    else:
        date = _dt.date.today().isoformat()
        ds_slug = "-".join(dataset_names) if dataset_names != list(SPECS) else "all"
        out_path = Path(__file__).parent / "results" / f"{date}-{ds_slug}-{sha}.md"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(md)
    print(f"wrote {out_path}")
    return 0


def main() -> int:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--datasets",
        default="all",
        help="comma-separated dataset names, or 'all' (default: all)",
    )
    parser.add_argument(
        "--models",
        default=None,
        help="comma-separated model names from models.yaml (default: all)",
    )
    parser.add_argument(
        "--repeat", type=int, default=1, help="repeat each case N times (default: 1)"
    )
    parser.add_argument(
        "--only",
        default=None,
        help="comma-separated case names to filter to (within each dataset)",
    )
    parser.add_argument(
        "--config",
        default=str(Path(__file__).parent / "models.yaml"),
        help="path to models.yaml (default: evals/models.yaml)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="explicit output path (default: evals/results/<date>-<slug>-<sha>.md)",
    )
    args = parser.parse_args()
    return asyncio.run(_amain(args))


if __name__ == "__main__":
    raise SystemExit(main())
