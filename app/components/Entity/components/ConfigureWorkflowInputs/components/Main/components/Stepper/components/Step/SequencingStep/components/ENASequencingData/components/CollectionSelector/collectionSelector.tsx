import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { useCallback } from "react";
import { Table } from "./components/Table/table";
import { getSequencingData } from "../../utils";
import { ColumnFilters } from "../../../../../components/ColumnFilters/columnFilters";
import { Table as TanStackTable } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { getRowSelectionState } from "../../utils";

export const CollectionSelector = ({
  configuredInput,
  onClose,
  onConfigure,
  onTransitionExited,
  open,
  table,
}: Props): JSX.Element => {
  const count = getRowSelectionCount(table);

  const onCancel = useCallback(() => {
    table.setRowSelection(getRowSelectionState(configuredInput)); // Restore previous selection.
    onClose();
  }, [configuredInput, onClose, table]);

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
