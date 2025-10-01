import os
from typing import Iterable, List, Sequence, Tuple


def write_markdown(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


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
