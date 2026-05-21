"""Render eval runs to markdown."""

from __future__ import annotations

import datetime as _dt
from collections import defaultdict
from dataclasses import dataclass
from typing import Any


@dataclass
class RunResult:
    dataset: str
    model: str
    cases: list[Any]  # objects with .name and .scores: dict[str, float]
    # (case_name, error_message, declared_evaluator_names). The third field is
    # the set of evaluator class names declared on the case in the dataset, so
    # we can credit a structural failure as 0/1 only for evaluators that were
    # actually in scope on that case.
    failures: list[tuple[str, str, frozenset[str]]]
    primary_score: str
    duration_seconds: float

    @property
    def total(self) -> int:
        return len(self.cases) + len(self.failures)

    def evaluator_count(self, evaluator: str) -> int:
        """Number of cases (incl. structural failures) where this evaluator was
        in scope. A failure only counts if the evaluator was declared on it."""
        n_cases = sum(1 for c in self.cases if evaluator in c.scores)
        n_failures = sum(1 for _, _, evs in self.failures if evaluator in evs)
        return n_cases + n_failures

    def avg(self, evaluator: str) -> float:
        """Average for cases where the evaluator was in scope.

        Cases lacking this evaluator are excluded from the denominator;
        structural failures are included as 0 (they can't score).
        """
        n = self.evaluator_count(evaluator)
        if n == 0:
            return 0.0
        s = sum(
            c.scores.get(evaluator, 0.0) for c in self.cases if evaluator in c.scores
        )
        return s / n

    def primary_avg(self) -> float:
        return self.avg(self.primary_score)

    def case_avg(self, case) -> float:
        """Average across all evaluators that ran on a single case."""
        if not case.scores:
            return 0.0
        return sum(case.scores.values()) / len(case.scores)


def _fmt_score(s: float, n: int) -> str:
    if n == 0:
        return "n/a"
    # Don't round to an integer -- fractional evaluators (keyword-fraction,
    # continuous judge scores) would lose precision and read as a fake count.
    return f"{s * n:.1f}/{n} ({s:.2f})"


def render_report(runs: list[RunResult], sha: str) -> str:
    by_dataset: dict[str, list[RunResult]] = defaultdict(list)
    for r in runs:
        by_dataset[r.dataset].append(r)

    out: list[str] = []
    out.append("# BRC Analytics evals")
    out.append("")
    out.append(
        "- Generated: "
        f"{_dt.datetime.now(_dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S')}Z"
    )
    out.append(f"- Commit: `{sha}`")
    out.append(f"- Datasets: {', '.join(sorted(by_dataset))}")
    out.append(f"- Models: {', '.join(sorted({r.model for r in runs}))}")
    out.append("")

    for dataset_name, ds_runs in sorted(by_dataset.items()):
        out.append(f"## `{dataset_name}`")
        out.append("")
        successful_evaluators = {e for r in ds_runs for c in r.cases for e in c.scores}
        failure_evaluators = {
            e for r in ds_runs for _, _, evs in r.failures for e in evs
        }
        evaluators = sorted(successful_evaluators | failure_evaluators)
        # Summary table -- denominators per evaluator reflect cases where that
        # evaluator was actually in scope, so partial-coverage scorers (e.g.
        # _NoToolCalls only on off_topic_redirect) aren't penalized for the
        # cases they don't apply to.
        out.append("| Model | " + " | ".join(evaluators) + " | n | duration |")
        out.append("|" + "---|" * (len(evaluators) + 3))
        for r in sorted(ds_runs, key=lambda x: x.model):
            row = [r.model]
            for ev in evaluators:
                row.append(_fmt_score(r.avg(ev), r.evaluator_count(ev)))
            row.append(str(r.total))
            row.append(f"{r.duration_seconds:.1f}s")
            out.append("| " + " | ".join(row) + " |")
        out.append("")
        # Per-case detail: average across all evaluators that ran on the case.
        # This handles cases like off_topic_redirect (uses _NoToolCalls) and
        # exploration_only (lacks FinalSchemaContains) without showing 0.00
        # spuriously for the unused primary_score.
        out.append(
            "<details><summary>Per-case detail (average across evaluators)</summary>"
        )
        out.append("")
        # Use a set union so cases that pass for one model and fail for another
        # are listed only once.
        case_names = sorted(
            {c.name for r in ds_runs for c in r.cases}
            | {n for r in ds_runs for n, _, _ in r.failures}
        )
        models = sorted({r.model for r in ds_runs})
        out.append("| Case | " + " | ".join(models) + " |")
        out.append("|" + "---|" * (len(models) + 1))
        for case in case_names:
            row = [case]
            for m in models:
                run = next((r for r in ds_runs if r.model == m), None)
                cell = "-"
                if run:
                    failure = next(
                        (msg for n, msg, _ in run.failures if n == case), None
                    )
                    if failure:
                        cell = f"FAIL: {failure[:30]}"
                    else:
                        c = next((c for c in run.cases if c.name == case), None)
                        if c is not None:
                            cell = f"{run.case_avg(c):.2f}"
                row.append(cell)
            out.append("| " + " | ".join(row) + " |")
        out.append("")
        out.append("</details>")
        out.append("")
    return "\n".join(out)
