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
    failures: list[tuple[str, str]]  # (case_name, error_message)
    primary_score: str
    duration_seconds: float

    @property
    def total(self) -> int:
        return len(self.cases) + len(self.failures)

    def avg(self, evaluator: str) -> float:
        if self.total == 0:
            return 0.0
        # Failures count as 0
        s = sum(c.scores.get(evaluator, 0.0) for c in self.cases)
        return s / self.total

    def primary_avg(self) -> float:
        return self.avg(self.primary_score)


def _fmt_score(s: float, total: int) -> str:
    return f"{int(round(s * total))}/{total} ({s:.2f})"


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
        evaluators = sorted({e for r in ds_runs for c in r.cases for e in c.scores})
        # Summary table
        out.append("| Model | " + " | ".join(evaluators) + " | n | duration |")
        out.append("|" + "---|" * (len(evaluators) + 3))
        for r in sorted(ds_runs, key=lambda x: x.model):
            row = [r.model]
            for ev in evaluators:
                row.append(_fmt_score(r.avg(ev), r.total))
            row.append(str(r.total))
            row.append(f"{r.duration_seconds:.1f}s")
            out.append("| " + " | ".join(row) + " |")
        out.append("")
        # Per-case detail
        out.append("<details><summary>Per-case detail</summary>")
        out.append("")
        case_names = sorted({c.name for r in ds_runs for c in r.cases}) + sorted(
            {n for r in ds_runs for n, _ in r.failures}
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
                    failure = next((msg for n, msg in run.failures if n == case), None)
                    if failure:
                        cell = f"FAIL: {failure[:30]}"
                    else:
                        c = next((c for c in run.cases if c.name == case), None)
                        if c is not None:
                            cell = f"{c.scores.get(run.primary_score, 0.0):.2f}"
                row.append(cell)
            out.append("| " + " | ".join(row) + " |")
        out.append("")
        out.append("</details>")
        out.append("")
    return "\n".join(out)
