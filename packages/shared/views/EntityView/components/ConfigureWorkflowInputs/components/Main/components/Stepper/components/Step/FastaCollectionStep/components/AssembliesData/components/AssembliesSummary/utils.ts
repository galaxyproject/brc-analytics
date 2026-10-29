import { type Assembly } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/AssembliesSelector/hooks/UseTable/types";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { type Table } from "@tanstack/react-table";

/**
 * Returns the configured assemblies, in the order they were configured.
 * @param table - Table instance.
 * @param fastaCollection - Configured assembly accessions.
 * @returns The configured assemblies listed in the table.
 */
export function getConfiguredAssemblies(
  table: Table<Assembly>,
  fastaCollection: ConfiguredInput["fastaCollection"]
): Assembly[] {
  const { rowsById } = table.getCoreRowModel();
  return (fastaCollection ?? []).flatMap((id) =>
    rowsById[id] ? [rowsById[id].original] : []
  );
}

/**
 * Renders the selected count heading.
 * @param count - Count of selected assemblies.
 * @returns The heading text.
 */
export function renderSelectedCount(count: number): string {
  if (count === 1) return "1 Assembly Selected";
  return `${count} Assemblies Selected`;
}
