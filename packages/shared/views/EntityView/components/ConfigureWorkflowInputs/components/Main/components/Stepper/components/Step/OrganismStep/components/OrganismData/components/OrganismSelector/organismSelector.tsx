import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { DialogContent } from "@mui/material";
import { ColumnFilters } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/ColumnFilters/columnFilters";
import { StyledDialog } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/SelectorDialog/selectorDialog.styles";
import { Table } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/Table/table";
import { type JSX } from "react";
import { type Props } from "./types";

/**
 * Organism selector dialog for browsing and selecting a species within the
 * workflow's clade.
 * @param props - Component props.
 * @param props.onClose - Callback to close the dialog.
 * @param props.open - Whether the dialog is open.
 * @param props.table - Organism table instance.
 * @returns Organism selector dialog component.
 */
export const OrganismSelector = ({
  onClose,
  open,
  table,
}: Props): JSX.Element => {
  return (
    <StyledDialog
      onClose={onClose}
      // Resets filters to initial state after the dialog close animation completes, ensuring the next time the dialog is opened, it shows the full list of organisms.
      onTransitionExited={() => table.resetColumnFilters()}
      open={open}
    >
      <DialogTitle onClose={onClose} title="Organism" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
    </StyledDialog>
  );
};
