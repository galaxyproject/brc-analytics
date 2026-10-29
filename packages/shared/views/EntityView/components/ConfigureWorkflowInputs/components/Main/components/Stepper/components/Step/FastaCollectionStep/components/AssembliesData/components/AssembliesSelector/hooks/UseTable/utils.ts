import { COLUMN_DEF } from "@databiosphere/findable-ui/lib/components/Table/common/columnDef";
import { formatAssemblyCount } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/utils";
import { ASSEMBLY_COLUMNS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/columnDef";
import { type ColumnDef, type Row } from "@tanstack/react-table";
import { type Assembly } from "./types";

/**
 * Builds the table columns: a row selection checkbox, then the assembly
 * columns. Selecting every row at once could pass the workflow's maximum, so
 * the select-all header is only offered when the workflow has none.
 * @param assemblyCountMax - Maximum assemblies allowed (null = no limit).
 * @returns The table columns.
 */
export function buildColumns(
  assemblyCountMax: number | null
): ColumnDef<Assembly>[] {
  const rowSelection =
    assemblyCountMax === null
      ? COLUMN_DEF.ROW_SELECTION
      : { ...COLUMN_DEF.ROW_SELECTION, header: "" };
  return [rowSelection as ColumnDef<Assembly>, ...ASSEMBLY_COLUMNS];
}

/**
 * Binds the row selectability check to whether the maximum is reached.
 * @param isMaxReached - Whether the workflow's maximum is reached.
 * @returns The table's row selectability check.
 */
export function buildEnableRowSelection(
  isMaxReached: boolean
): (row: Row<Assembly>) => boolean {
  return (row) => canSelectAssembly(row, isMaxReached);
}

/**
 * Binds the row selection validation message to the workflow's maximum.
 * @param isMaxReached - Whether the workflow's maximum is reached.
 * @param assemblyCountMax - Maximum assemblies allowed (null = no limit).
 * @returns The table's row selection validation.
 */
export function buildGetRowSelectionValidation(
  isMaxReached: boolean,
  assemblyCountMax: number | null
): (row: Row<Assembly>) => string | undefined {
  return (row) =>
    getAssemblySelectionValidation(row, isMaxReached, assemblyCountMax);
}

/**
 * Determines whether a row can be selected: a selected row can always be
 * deselected, and an unselected one only while the maximum isn't reached.
 * @param row - Row.
 * @param isMaxReached - Whether the workflow's maximum is reached.
 * @returns True if the row can be selected.
 */
export function canSelectAssembly(
  row: Row<Assembly>,
  isMaxReached: boolean
): boolean {
  return row.getIsSelected() || !isMaxReached;
}

/**
 * Returns a row's id: its assembly accession.
 * @param assembly - Assembly.
 * @returns The row id.
 */
export function getAssemblyRowId(assembly: Assembly): string {
  return assembly.accession;
}

/**
 * Returns why a row can't be selected, shown as the row checkbox's tooltip.
 * @param row - Row.
 * @param isMaxReached - Whether the workflow's maximum is reached.
 * @param assemblyCountMax - Maximum assemblies allowed (null = no limit).
 * @returns The reason, or undefined when the row can be selected.
 */
export function getAssemblySelectionValidation(
  row: Row<Assembly>,
  isMaxReached: boolean,
  assemblyCountMax: number | null
): string | undefined {
  if (canSelectAssembly(row, isMaxReached) || assemblyCountMax === null) return;
  return `Up to ${formatAssemblyCount(assemblyCountMax)} can be selected`;
}
