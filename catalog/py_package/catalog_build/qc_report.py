from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Iterable, List, Sequence, Tuple

from pydantic import BaseModel, Field


@dataclass
class QcDiffResult[T]:
    diff: T
    has_content: bool


@dataclass
class QcReportRenderContext:
    is_diff: bool
    containing_section_level: int = 0

    def get_empty_list_text(self):
        return "No new items" if self.is_diff else "None"


class QcReportElement(BaseModel):
    def derive_diff_result(
        self, field_results: Mapping[str, QcDiffResult]
    ) -> QcDiffResult:
        return QcDiffResult(
            self.model_copy(update={k: res.diff for k, res in field_results.items()}),
            has_content=any(res.has_content for res in field_results.values()),
        )

    def format_markdown(self, context: QcReportRenderContext) -> list[str]:
        raise Exception("Unimplemented")

    def format_markdown_text(self, context: QcReportRenderContext) -> str:
        return join_report(self.format_markdown(context))


class QcReportList[T](QcReportElement):
    data: list[T]


class QcReportKeyedList[T](QcReportElement):
    data: dict[str, T]


class QcResultDbtTestFailureSample(QcReportList[dict]):
    def format_markdown(self, context) -> List[str]:
        return format_markdown_table(self.data, cell_truncation_threshold=200)


class QcResultDbtTestFailures(QcReportElement):
    count: int
    sample: QcResultDbtTestFailureSample

    def format_markdown(self, context) -> List[str]:
        return [
            *self.sample.format_markdown(context),
            *(
                [
                    f"_Showing {len(self.sample.data)} of {self.count} failing rows._",
                    "",
                ]
                if self.count > len(self.sample.data)
                else []
            ),
        ]


class QcResultDbtTest(QcReportElement):
    test_name: str
    success: bool
    status: str
    message: str | None
    failures: QcResultDbtTestFailures | None

    def format_markdown(self, context) -> List[str]:
        count = self.failures.count if self.failures else None
        count_text = (
            f", {count} failing row{'' if count == 1 else 's'}"
            if count is not None
            else ""
        )
        return [
            format_heading(
                f"`{self.test_name}` — status `{self.status}`{count_text}", 3, context
            ),
            "",
            *([self.message, ""] if self.message else []),
            *(self.failures.format_markdown(context) if self.failures else []),
        ]


class QcResultDbtTestResults(QcReportKeyedList[QcResultDbtTest]):
    def derive_diff_result(
        self, field_results: Mapping[str, QcDiffResult]
    ) -> QcDiffResult:
        # Only count failed tests in the diff
        failed_tests = {
            k: test_result
            for k, test_result in field_results["data"].diff.items()
            if not test_result.success
        }
        return super().derive_diff_result(
            {"data": QcDiffResult(failed_tests, has_content=bool(failed_tests))}
        )

    def format_markdown(self, context) -> List[str]:
        unsuccessful = [result for result in self.data.values() if not result.success]
        lines = [
            format_heading("Unsuccessful dbt tests", 2, context),
            "",
        ]
        if not unsuccessful:
            lines += [context.get_empty_list_text(), ""]
            return lines
        for result in unsuccessful:
            lines += result.format_markdown(context)
        return lines


class QcResultGcaWithPairedGcf(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading(
                "GenBank assemblies with paired RefSeq accessions", 2, context
            ),
            [f"{gca} (paired RefSeq: {gcf})" for gca, gcf in self.data],
            context,
        )


class QcResultInconsistentTaxonomyIds(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading(
                "Species and strain combinations with multiple taxonomy IDs", 2, context
            ),
            [f"{taxon}: {ids}" for taxon, ids in self.data],
            context,
        )


class QcResultMissingDatacacheUrls(QcReportList):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Assemblies with datacache URLs not found", 2, context),
            self.data,
            context,
        )


class QcResultMissingGeneModelUrls(QcReportList):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Assemblies with gene model URLs not found", 2, context),
            self.data,
            context,
        )


class QcResultMissingNcbiAssemblies(QcReportList):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Assemblies not found on NCBI", 2, context),
            self.data,
            context,
        )


class QcResultMissingOutbreakDescendants(QcReportList):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading(
                "Outbreak descendant taxonomy IDs not found in genomes data", 2, context
            ),
            self.data,
            context,
        )


class QcResultMissingPloidyAssemblies(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Assemblies without ploidy information", 2, context),
            [
                f"{accession} (speciesTaxonomyId: {tax_id})"
                for accession, tax_id in self.data
            ],
            context,
        )


class QcResultMissingUcscAssemblies(QcReportList):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Assemblies not found in UCSC list", 2, context),
            self.data,
            context,
        )


class QcResultOrganismsNotSpeciesRank(QcReportList[tuple[Any, Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Organisms not at species rank", 2, context),
            [f"{tax_id}: {name} (rank: {rank})" for tax_id, name, rank in self.data],
            context,
        )


class QcResultOrganismsWithoutAssemblies(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Organisms not matched to any assembly", 2, context),
            [f"{tax_id}: {name}" for tax_id, name in self.data],
            context,
        )


class QcResultOutbreakTaxonomyIssues(QcReportList[tuple[Any, Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading(
                "Outbreak primary taxonomy ID issues (not in catalog or below species rank)",
                2,
                context,
            ),
            [f"{tax_id}: {name} ({reason})" for tax_id, name, reason in self.data],
            context,
        )


class QcResultOutdatedAccessions(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Outdated assembly accessions", 2, context),
            [f"{acc} (current: {curr_acc})" for acc, curr_acc in self.data],
            context,
        )


class QcResultSupressedGenomes(QcReportList[tuple[Any, Any]]):
    def format_markdown(self, context) -> List[str]:
        return format_list_section(
            format_heading("Suppressed or retired genomes", 2, context),
            [f"{acc} (status: {status})" for acc, status in self.data],
            context,
        )


class QcResultTaxonomyTreeLeavesMissingSpecies(QcReportList):
    def format_markdown_text(self, context) -> str:
        return format_inline_list(self.data, context)


class QcResultTaxonomyTreeZeroAssembliesTaxa(QcReportList):
    def format_markdown_text(self, context) -> str:
        return format_inline_list(self.data, context)


class QcResultTaxonomyTreeMissingRanks(QcReportList[str]):
    def format_markdown_text(self, context) -> str:
        return format_inline_list(self.data, context)


class QcResultTaxonomyTreeChecks(QcReportElement):
    assemblies_actual_vs_expected: tuple[int, int] | None
    leaves_missing_species: QcResultTaxonomyTreeLeavesMissingSpecies
    zero_assemblies_taxa: QcResultTaxonomyTreeZeroAssembliesTaxa
    missing_ranks: QcResultTaxonomyTreeMissingRanks

    def format_markdown(self, context) -> List[str]:
        return [
            format_heading("Taxonomy tree", 2, context),
            "",
            "Assembly count mismatch: "
            + (
                "None"
                if self.assemblies_actual_vs_expected is None
                else f"Found combined assembly count of {self.assemblies_actual_vs_expected[0]} among nodes of species rank, expected {self.assemblies_actual_vs_expected[1]}"
            ),
            "",
            "List of leaves without species in lineage: "
            + self.leaves_missing_species.format_markdown_text(context),
            "",
            "List of taxa with assembly count 0: "
            + self.zero_assemblies_taxa.format_markdown_text(context),
            "",
            "List of taxonomic levels specified in parameters but absent in tree: "
            + self.missing_ranks.format_markdown_text(context),
            "",
        ]


class QcResultDataReport(QcReportElement):
    diff_content_fields: set[str] | None = Field(default=None, exclude=True)
    dbt_test_results: QcResultDbtTestResults
    inconsistent_taxonomy_ids: QcResultInconsistentTaxonomyIds
    missing_datacache_urls: QcResultMissingDatacacheUrls
    missing_gene_model_urls: QcResultMissingGeneModelUrls
    missing_ncbi_assemblies: QcResultMissingNcbiAssemblies
    missing_outbreak_descendants: QcResultMissingOutbreakDescendants
    missing_ploidy_assemblies: QcResultMissingPloidyAssemblies
    missing_ucsc_assemblies: QcResultMissingUcscAssemblies
    organisms_not_species_rank: QcResultOrganismsNotSpeciesRank
    organisms_without_assemblies: QcResultOrganismsWithoutAssemblies
    outbreak_taxonomy_issues: QcResultOutbreakTaxonomyIssues = (
        QcResultOutbreakTaxonomyIssues(data=[])
    )
    outdated_accessions: QcResultOutdatedAccessions
    paired_accessions: QcResultGcaWithPairedGcf
    suppressed_genomes: QcResultSupressedGenomes
    tree_checks: QcResultTaxonomyTreeChecks

    def derive_diff_result(
        self, field_results: Mapping[str, QcDiffResult]
    ) -> QcDiffResult:
        result = super().derive_diff_result(field_results)
        result.diff.diff_content_fields = set(
            k for k, res in field_results.items() if res.has_content
        )
        return result

    def format_markdown(self, context) -> list[str]:
        sections_order = [
            "missing_ncbi_assemblies",
            "missing_ucsc_assemblies",
            "missing_gene_model_urls",
            "missing_datacache_urls",
            "inconsistent_taxonomy_ids",
            "missing_ploidy_assemblies",
            "missing_outbreak_descendants",
            "outbreak_taxonomy_issues",
            "organisms_not_species_rank",
            "organisms_without_assemblies",
            "outdated_accessions",
            "suppressed_genomes",
            "paired_accessions",
            "tree_checks",
            "dbt_test_results",
        ]
        if self.diff_content_fields is not None:
            sections_order = [
                k for k in sections_order if k in self.diff_content_fields
            ]
        lines = [
            format_heading(
                "New and changed QC report items"
                if context.is_diff
                else "Catalog Data QC report",
                1,
                context,
            ),
            "",
        ]
        for k in sections_order:
            lines += getattr(self, k).format_markdown(context)
        return lines


def get_qc_report_diff[T](prev, current: T) -> QcDiffResult[T]:
    if prev is None:
        return QcDiffResult(current, has_content=current is not None)

    if isinstance(current, QcReportList):
        if not isinstance(prev, QcReportList):
            raise ValueError("Cannot diff QcReportList against another type")
        diff_list = [v for v in current.data if v not in prev.data]
        return current.derive_diff_result(
            {"data": QcDiffResult(diff_list, has_content=bool(diff_list))}
        )

    if isinstance(current, QcReportKeyedList):
        if not isinstance(prev, QcReportKeyedList):
            raise ValueError("Cannot diff QcReportKeyedList against another type")
        diff_dict = {}
        for k, v in current.data.items():
            item_result = get_qc_report_diff(prev.data.get(k), v)
            if item_result.has_content:
                diff_dict[k] = item_result.diff
        return current.derive_diff_result(
            {"data": QcDiffResult(diff_dict, has_content=bool(diff_dict))}
        )

    if isinstance(current, QcReportElement):
        field_results: dict[str, QcDiffResult] = {}
        for k, info in type(current).model_fields.items():
            if info.exclude:
                continue
            field_results[k] = get_qc_report_diff(getattr(prev, k), getattr(current, k))
        return current.derive_diff_result(field_results)

    return QcDiffResult(current, has_content=current != prev)


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


def format_markdown_table(table_rows: list[dict], **cell_options) -> list[str]:
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


def format_inline_list(
    items: Sequence[str] | None, context: QcReportRenderContext
) -> str:
    return ", ".join(items) if items else context.get_empty_list_text()


def format_heading(title: str, level: int, context: QcReportRenderContext) -> str:
    return ("#" * (context.containing_section_level + level)) + " " + title


def section_header(heading: str) -> List[str]:
    return [heading, ""]


def format_list_section(
    title: str, items: Sequence, context: QcReportRenderContext | None = None
) -> List[str]:
    lines = section_header(title)
    if not items:
        lines += ["None" if context is None else context.get_empty_list_text(), ""]
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
