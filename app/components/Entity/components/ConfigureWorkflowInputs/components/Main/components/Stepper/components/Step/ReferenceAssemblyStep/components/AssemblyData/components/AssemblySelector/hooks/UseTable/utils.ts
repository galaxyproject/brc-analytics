import { ColumnFiltersState, Table } from "@tanstack/react-table";
import { Workflow } from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  WORKFLOW_PARAMETER_VARIABLE,
  WORKFLOW_PLOIDY,
} from "../../../../../../../../../../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";
import { CATEGORY_CONFIGS } from "./categoryConfigs";
import { Assembly } from "./types";

/** Returns the initial column filters for the table based on the workflow's ploidy.
 * If the workflow's ploidy is not "ANY", it pre-selects the ploidy filter with the workflow's ploidy value.
 * If the workflow has a taxonomy requirement, it pre-selects the taxonomy filter with the workflow's taxonomy ID.
 * If the workflow requires ASSEMBLY_ID, it filters to only show assemblies with Galaxy datacache URLs.
 * @param workflow - Workflow to get the ploidy from.
 * @returns The initial column filters for the table.
 */
export function getInitialColumnFilters(
  workflow: Workflow
): ColumnFiltersState {
  const columnFilterState = [];

  // If the workflow has a specific ploidy requirement, pre-select that ploidy in the filters.
  if (workflow.ploidy !== WORKFLOW_PLOIDY.ANY) {
    columnFilterState.push({
      id: CATEGORY_CONFIGS.PLOIDY.key,
      value: [workflow.ploidy],
    });
  }

  // If the workflow has a specific taxonomy requirement, pre-select the lineage taxonomy in the filters.
  if (workflow.taxonomyId) {
    columnFilterState.push({
      id: CATEGORY_CONFIGS.LINEAGE_TAXONOMY_IDS.key,
      value: [workflow.taxonomyId],
    });
  }

  // If the workflow requires ASSEMBLY_ID, filter to only show assemblies with Galaxy datacache URLs.
  // ASSEMBLY_ID workflows need pre-built indexes (Bowtie2, BWA, etc.) accessible via datacache.
  const requiresAssemblyId = workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.ASSEMBLY_ID
  );
  if (requiresAssemblyId) {
    columnFilterState.push({
      id: CATEGORY_CONFIGS.GALAXY_DATACACHE_URL.key,
      value: ["Yes"],
    });
  }

  return columnFilterState;
}

/** Renders the summary row counts for the table.
 * @param table - Table instance.
 * @returns The summary row counts for the table.
 */
export function renderSummary(table: Table<Assembly>): string {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();

  return `${rowCount} matching ${rowCount === 1 ? "assembly" : "assemblies"} of ${rows.length}`;
}
