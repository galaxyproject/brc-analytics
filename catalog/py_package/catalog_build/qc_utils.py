import os
from typing import Iterable, List, Sequence, Tuple


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
