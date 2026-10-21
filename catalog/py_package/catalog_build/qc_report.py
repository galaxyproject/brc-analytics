from __future__ import annotations

import os
from typing import Iterable, List, Sequence, Tuple

from pydantic import BaseModel


class QcDiffEmptyType:
    def __repr__(self) -> str:
        return "<QC_DIFF_EMPTY>"


QC_DIFF_EMPTY = QcDiffEmptyType()


class QcReportElement(BaseModel):
    def format_markdown(self) -> str:
        raise Exception("Unimplemented")


class QcReportList(QcReportElement):
    data: list


class QcReportKeyedList(QcReportElement):
    data: dict


def get_qc_report_diff(prev, current):
    if prev is None:
        return QC_DIFF_EMPTY if current is None else current

    if isinstance(current, QcReportList):
        if not isinstance(prev, QcReportList):
            raise ValueError("Cannot diff QcReportList against another type")
        diff_data = [v for v in current.data if v in prev.data]
        return (
            current.model_copy(update={"data": diff_data})
            if diff_data
            else QC_DIFF_EMPTY
        )

    if isinstance(current, QcReportKeyedList):
        if not isinstance(prev, QcReportKeyedList):
            raise ValueError("Cannot diff QcReportKeyedList against another type")
        diff_data = {}
        for k, v in current.data.items():
            item_diff = get_qc_report_diff(prev.data.get(k), v)
            if item_diff is not QC_DIFF_EMPTY:
                diff_data[k] = item_diff
        return current.model_copy(update={"data": diff_data})

    if isinstance(current, QcReportElement):
        update = {}
        for k in type(current).model_fields.keys():
            attr_diff = get_qc_report_diff(getattr(prev, k), getattr(current, k))
            if attr_diff is not QC_DIFF_EMPTY:
                update[k] = attr_diff
        return current.model_copy(update=update) if update else QC_DIFF_EMPTY

    return QC_DIFF_EMPTY if current == prev else current


def write_markdown(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def _format_table_cell(value, *, cell_truncation_threshold: int | None = None):
    # Keep row values on a single markdown table cell/line, with optional limited length.
    if value is None:
        return ""
    string_value = str(value)
    if cell_truncation_threshold is not None:
        original_length = len(string_value)
        if original_length > cell_truncation_threshold:
            string_value = f"{string_value[:cell_truncation_threshold]} ({original_length - cell_truncation_threshold} characters truncated)"
    return string_value.replace("\\", "\\\\").replace("|", "\\|").replace("\n", " ")


def format_markdown_table(table_rows, **cell_options):
    # Render a list of dictionaries as a markdown table.
    if not table_rows:
        return ["_No rows present_", ""]
    columns = list(table_rows[0].keys())
    lines = [
        "| " + " | ".join(columns) + " |",
        "| " + " | ".join("---" for _ in columns) + " |",
    ]
    for row in table_rows:
        lines.append(
            "| "
            + " | ".join(
                _format_table_cell(row[col], **cell_options) for col in columns
            )
            + " |"
        )
    lines.append("")
    return lines


def section_header(title: str) -> List[str]:
    return [title, ""]


def format_list_section(title: str, items: Sequence[str]) -> List[str]:
    lines = section_header(title)
    if not items:
        lines += ["None", ""]
    else:
        lines += [f"- {item}" for item in items] + [""]
    return lines


def format_kv_list_section(title: str, rows: Sequence[Tuple[str, str]]) -> List[str]:
    lines = section_header(title)
    if not rows:
        lines += ["None", ""]
    else:
        lines += [f"- {k}: {v}" for k, v in rows] + [""]
    return lines


def join_report(lines: Iterable[str]) -> str:
    return "\n".join(lines)


def format_raw_section(title: str, body: str) -> List[str]:
    lines = section_header(title)
    lines += [body, ""]
    return lines
