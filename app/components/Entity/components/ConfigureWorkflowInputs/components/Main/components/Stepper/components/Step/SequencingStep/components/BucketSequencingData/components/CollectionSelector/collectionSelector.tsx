import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { useState } from "react";
import { Table } from "./components/Table/table";
import { RowSelectionState } from "@tanstack/table-core";
import { buildEnaSequencingReads } from "../../utils";
import { ColumnFilters } from "./components/ColumnFilters/columnFilters";
import { preSelectColumnFilters } from "./utils";

export const CollectionSelector = ({
  onClose,
  onConfigure,
  open,
  selectedCount,
  stepKey,
  table,
}: Props): JSX.Element => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  return (
    <StyledDialog
      onTransitionEnter={() => {
        setRowSelection(table.getState().rowSelection);
        if (selectedCount > 0) return;
        preSelectColumnFilters(table, stepKey);
        table.resetSorting(); // Reset sorting to default.
      }}
      onClose={onClose}
      open={open}
    >
      <DialogTitle onClose={onClose} title="Select Sequencing Runs" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
      <DialogActions>
        <Button
          {...BUTTON_PROPS.SECONDARY_CONTAINED}
          onClick={() => {
            table.setRowSelection(rowSelection);
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={selectedCount === 0}
          onClick={() => {
            onConfigure(stepKey, buildEnaSequencingReads(table));
            onClose();
          }}
        >
          {renderButtonText(selectedCount)}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

/**
 * Renders the button text based on the selected count.
 * @param selectedCount - The number of selected rows.
 * @returns The button text.
 */
function renderButtonText(selectedCount: number): string {
  if (selectedCount === 1) return "Add 1 Sequencing Run";
  return `Add ${selectedCount} Sequencing Runs`;
}
