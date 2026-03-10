import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { Button, DialogActions, DialogContent } from "@mui/material";
import { Table as TanStackTable } from "@tanstack/react-table";
import { JSX } from "react";
import { ColumnFilters } from "../../../../../components/ColumnFilters/columnFilters";
import { Table } from "../../../../../components/Table/table";
import { ReadRun } from "../../types";
import { getSequencingData } from "../../utils";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";

/**
 * Collection selector dialog for browsing and selecting sequencing runs.
 * @param props - Component props.
 * @param props.onCancel - Callback to cancel and close the dialog.
 * @param props.onClose - Callback to close the dialog.
 * @param props.onConfigure - Callback to configure sequencing data.
 * @param props.onTransitionExited - Callback fired after the dialog exit transition.
 * @param props.open - Whether the dialog is open.
 * @param props.table - Sequencing runs table instance.
 * @returns Collection selector dialog component.
 */
export const CollectionSelector = ({
  onCancel,
  onClose,
  onConfigure,
  onTransitionExited,
  open,
  table,
}: Props): JSX.Element => {
  const count = getRowSelectionCount(table);
  return (
    <StyledDialog
      onClose={onCancel}
      onTransitionExited={onTransitionExited}
      open={open}
    >
      <DialogTitle onClose={onCancel} title="Select Sequencing Runs" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
      <DialogActions>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={count === 0}
          onClick={() => {
            onConfigure(getSequencingData(table));
            onClose();
          }}
        >
          {renderButtonText(count)}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

/**
 * Returns the count of selected rows.
 * @param table - The TanStack Table instance.
 * @returns The count of selected rows.
 */
function getRowSelectionCount(table: TanStackTable<ReadRun>): number {
  return Object.values(table.getState().rowSelection).length;
}

/**
 * Renders the button text based on the selected count.
 * @param count - Count of selected rows.
 * @returns The button text.
 */
function renderButtonText(count: number): string {
  if (count === 1) return "Add 1 Sequencing Run";
  return `Add ${count} Sequencing Runs`;
}
