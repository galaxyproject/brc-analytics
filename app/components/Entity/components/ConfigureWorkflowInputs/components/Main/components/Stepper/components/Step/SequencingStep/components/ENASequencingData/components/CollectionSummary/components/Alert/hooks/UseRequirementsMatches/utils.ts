import { ColumnFiltersState, Row } from "@tanstack/react-table";
import { ReadRun } from "../../../../../../types";
import { COLUMN_KEY_TO_LABEL } from "./constants";
import { BRCDataCatalogGenome } from "../../../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../../../../../../../../../../../../../../../apis/catalog/ga2/entities";
import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";

/**
 * Builds warnings for column filter mismatches.
 * @param initialColumnFilters - Pre-selected column filters.
 * @param rows - Selected rows.
 * @returns Array of warning messages.
 */
function buildDataWarnings(
  initialColumnFilters: ColumnFiltersState,
  rows: Row<ReadRun>[]
): string[] {
  const warnings = [];

  // Iterate over column filters to find row data that does not match the expected pre-filter value.
  for (const { id, value } of initialColumnFilters) {
    if (!Array.isArray(value)) continue; // Type check; value is always an array.

    const key = id as keyof ReadRun;

    // Build a set of unmatched values.
    const unmatchedSet: Set<ReadRun[keyof ReadRun]> = new Set();
    for (const row of rows) {
      // Get the value of the column for the row.
      const rowValue = row.original[key];

      // Compare the row value to the expected value.
      if (value.includes(rowValue)) continue;

      // Add the unmatched value to the set.
      unmatchedSet.add(rowValue);
    }

    if (unmatchedSet.size === 0) continue;

    const expected = value.join(" OR ");
    const actual = [...unmatchedSet].join(", ");

    // If there are unmatched values, add the warning.
    warnings.push(
      `${COLUMN_KEY_TO_LABEL[key] ?? key} mismatch: expected ${expected}, but ${actual} selected`
    );
  }

  return warnings;
}

/**
 * Builds requirement warnings for the currently selected rows.
 * Aggregates species mismatch warnings and data (column filter) mismatch warnings.
 * @param initialColumnFilters - Pre-selected column filters.
 * @param rows - Selected table rows.
 * @param genome - Target genome entity used to validate selection.
 * @returns Array of warning messages.
 */
export function buildRequirementWarnings(
  initialColumnFilters: ColumnFiltersState,
  rows: Row<ReadRun>[],
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): string[] {
  if (rows.length === 0) return [];
  const speciesWarnings = buildSpeciesWarnings(rows, genome);
  const dataWarnings = buildDataWarnings(initialColumnFilters, rows);
  return speciesWarnings.concat(dataWarnings);
}

/**
 * Builds warnings for species mismatches.
 * @param rows - Selected rows.
 * @param genome - Genome entity.
 * @returns Array of warning messages.
 */
function buildSpeciesWarnings(
  rows: Row<ReadRun>[],
  genome: BRCDataCatalogGenome | GA2AssemblyEntity
): string[] {
  const { ncbiTaxonomyId, taxonomicLevelSpecies } = genome;

  // Build a set of unmatched values.
  const unmatchedSet = new Set();
  for (const { original } of rows) {
    const { scientific_name = LABEL.UNSPECIFIED, tax_id } = original;
    // Compare the row value to the expected value.
    if (ncbiTaxonomyId === tax_id) continue;

    // Add the unmatched value to the set.
    unmatchedSet.add(`${tax_id} (${scientific_name})`);
  }

  if (unmatchedSet.size === 0) return [];

  const expected = `${ncbiTaxonomyId} (${taxonomicLevelSpecies})`;
  const actual = [...unmatchedSet].join(", ");

  // If there are unmatched values, return the warning.
  return [
    `Species mismatch: data is not from the selected taxonomy ID expected ${expected} but ${actual} selected`,
  ];
}
