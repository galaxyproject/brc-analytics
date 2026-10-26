import json

from .qc_report import (
    QcReportRenderContext,
    QcResultDataReport,
    format_list_section,
    get_qc_report_diff,
)


def make_catalog_drift_report(
    *,
    assemblies_json_before_path: str,
    assemblies_json_after_path: str,
    qc_json_before_path: str,
    qc_json_after_path: str,
    output_path: str,
):
    with open(assemblies_json_before_path, encoding="utf8") as f:
        assemblies_before = json.load(f)
    with open(assemblies_json_after_path, encoding="utf8") as f:
        assemblies_after = json.load(f)
    with open(qc_json_before_path, encoding="utf8") as f:
        qc_report_before = QcResultDataReport.model_validate_json(f.read())
    with open(qc_json_after_path, encoding="utf8") as f:
        qc_report_after = QcResultDataReport.model_validate_json(f.read())

    qc_report_diff = get_qc_report_diff(qc_report_before, qc_report_after).diff

    assembly_accessions_after = {a["accession"] for a in assemblies_after}
    dropped_assembly_accessions = [
        a["accession"]
        for a in assemblies_before
        if a["accession"] not in assembly_accessions_after
    ]

    drift_report_lines = [
        "## Catalog data summary",
        "",
        "### Entity counts",
        "",
        f"Assemblies on the site before: {len(assemblies_before)}",
        "",
        f"Assemblies on the site after: {len(assemblies_after)}",
        "",
        *format_list_section("### Dropped assemblies", dropped_assembly_accessions),
    ]

    drift_report_lines += qc_report_diff.format_markdown(
        QcReportRenderContext(is_diff=True, containing_section_level=1)
    )

    drift_report_text = "\n".join(drift_report_lines)

    with open(output_path, "w", encoding="utf8") as f:
        f.write(drift_report_text)
