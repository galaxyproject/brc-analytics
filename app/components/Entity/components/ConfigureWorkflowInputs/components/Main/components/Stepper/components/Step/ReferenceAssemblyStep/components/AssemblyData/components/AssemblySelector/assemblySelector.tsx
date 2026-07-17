import { ColumnFilters } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/ColumnFilters/columnFilters";
import { Table } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Table/table";
import { StyledDialog } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/assemblySelector.styles";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { DialogContent } from "@mui/material";
import { JSX } from "react";
import { Props } from "./types";

/**
 * Assembly selector dialog for browsing and selecting a reference assembly.
 * @param props - Component props.
 * @param props.onClose - Callback to close the dialog.
 * @param props.open - Whether the dialog is open.
 * @param props.table - Assembly table instance.
 * @returns Assembly selector dialog component.
 */
export const AssemblySelector = ({
  onClose,
  open,
  table,
}: Props): JSX.Element => {
  return (
    <StyledDialog
      onClose={onClose}
      // Resets filters to initial state after the dialog close animation completes, ensuring the next time the dialog is opened, it shows the pre-filtered list of assemblies.
      onTransitionExited={() => table.resetColumnFilters()}
      open={open}
    >
      <DialogTitle onClose={onClose} title="Reference Assembly" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
    </StyledDialog>
  );
};
