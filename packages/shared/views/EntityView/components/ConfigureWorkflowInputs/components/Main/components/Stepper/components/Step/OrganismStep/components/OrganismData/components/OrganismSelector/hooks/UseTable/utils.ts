import type { Workflow } from "@repo/shared/apis/workflow";
import {
  formatAssemblyCount,
  hasEnoughAssemblies,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";
import {
  getRequiredAssemblyCount,
  workflowRequiresFastaCollection,
} from "@repo/shared/workflow/utils";
import { type Row, type Table } from "@tanstack/react-table";
import { getOrganismAssemblyCount } from "./accessorFn";
import { type Organism } from "./types";

/**
 * Binds the row selectability check to the workflow being configured.
 * @param workflow - Workflow being configured.
 * @returns The table's row selectability check.
 */
export function buildEnableOrganismSelection(
  workflow: Workflow
): (row: Row<Organism>) => boolean {
  return (row) => canSelectOrganism(row.original, workflow);
}

/**
 * Binds the row selection validation message to the workflow being configured.
 * @param workflow - Workflow being configured.
 * @returns The table's row selection validation.
 */
export function buildGetOrganismSelectionValidation(
  workflow: Workflow
): (row: Row<Organism>) => string | undefined {
  return (row) => getOrganismSelectionValidation(row.original, workflow);
}

/**
 * Determines whether an organism can be picked: when the workflow takes a
 * collection of the organism's assemblies, the organism must have at least the
 * number of assemblies the workflow requires.
 * @param organism - Organism.
 * @param workflow - Workflow being configured.
 * @returns True if the organism can be picked.
 */
export function canSelectOrganism(
  organism: Organism,
  workflow: Workflow
): boolean {
  if (!workflowRequiresFastaCollection(workflow)) return true;
  return hasEnoughAssemblies(getOrganismAssemblyCount(organism), workflow);
}

/**
 * Returns why an organism can't be picked, shown as the select button's tooltip.
 * @param organism - Organism.
 * @param workflow - Workflow being configured.
 * @returns The reason, or undefined when the organism can be picked.
 */
export function getOrganismSelectionValidation(
  organism: Organism,
  workflow: Workflow
): string | undefined {
  if (canSelectOrganism(organism, workflow)) return;
  return `This workflow needs at least ${formatAssemblyCount(getRequiredAssemblyCount(workflow))}; this organism has ${getOrganismAssemblyCount(organism)}.`;
}

/** Renders the summary row counts for the table.
 * @param table - Table instance.
 * @returns The summary row counts for the table.
 */
export function renderSummary(table: Table<Organism>): string {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();

  return `${rowCount} matching ${rowCount === 1 ? "organism" : "organisms"} of ${rows.length}`;
}
