import type { Workflow } from "@repo/shared/apis/workflow";
import {
  formatAssemblyCount,
  hasEnoughAssemblies,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";
import {
  type ConfiguredInput,
  type OnConfigure,
} from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { type RowSelectionState, type Table } from "@tanstack/react-table";
import { type Assembly } from "./hooks/UseTable/types";

/**
 * Configures the selected assemblies, then closes the dialog.
 * @param table - Table instance.
 * @param stepKey - Key identifying the configured input field.
 * @param referenceAssembly - Configured reference assembly accession, if any.
 * @param onConfigure - Callback to configure workflow input.
 * @param onClose - Callback to close the dialog.
 */
export function addSelection(
  table: Table<Assembly>,
  stepKey: string,
  referenceAssembly: ConfiguredInput["referenceAssembly"],
  onConfigure: OnConfigure,
  onClose: () => void
): void {
  onConfigure(getFastaCollectionData(table, stepKey, referenceAssembly));
  onClose();
}

/**
 * Builds the row selection state for the configured assemblies.
 * @param fastaCollection - Configured assembly accessions.
 * @returns Row selection state.
 */
export function buildRowSelection(
  fastaCollection: ConfiguredInput["fastaCollection"]
): RowSelectionState {
  return Object.fromEntries((fastaCollection ?? []).map((id) => [id, true]));
}

/**
 * Returns why the selection can't be added yet, shown as the add button's
 * tooltip: fewer assemblies are selected than the workflow requires.
 * @param count - Count of selected rows.
 * @param workflow - Workflow being configured.
 * @returns The reason, or undefined when the selection can be added.
 */
export function getAddSelectionValidation(
  count: number,
  workflow: Workflow
): string | undefined {
  if (hasEnoughAssemblies(count, workflow)) return;
  return `Select at least ${formatAssemblyCount(workflow.assemblyCountMin)}`;
}

/**
 * Returns the selected assemblies as configured input. The reference assembly
 * is chosen from the selected assemblies, so when the selection no longer
 * includes it, the reference and its gene model are cleared.
 * @param table - Table instance.
 * @param stepKey - Key identifying the configured input field.
 * @param referenceAssembly - Configured reference assembly accession, if any.
 * @returns Partial configured input with the selected assembly accessions.
 */
export function getFastaCollectionData(
  table: Table<Assembly>,
  stepKey: string,
  referenceAssembly: ConfiguredInput["referenceAssembly"]
): Partial<ConfiguredInput> {
  const accessions = table.getSelectedRowModel().rows.map(({ id }) => id);
  if (!referenceAssembly || accessions.includes(referenceAssembly))
    return { [stepKey]: accessions };
  return {
    geneModelUrl: undefined,
    referenceAssembly: undefined,
    [stepKey]: accessions,
  };
}

/**
 * Returns the count of selected rows.
 * @param table - Table instance.
 * @returns The count of selected rows.
 */
export function getRowSelectionCount(table: Table<Assembly>): number {
  return Object.keys(table.getState().rowSelection).length;
}

/**
 * Renders the add button text based on the selected count.
 * @param count - Count of selected rows.
 * @returns The button text.
 */
export function renderButtonText(count: number): string {
  if (count === 1) return "Add 1 Assembly";
  return `Add ${count} Assemblies`;
}
