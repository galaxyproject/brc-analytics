import { JSX } from "react";
import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./tracksSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { useCallback, useState } from "react";
import { RowSelectionState } from "@tanstack/table-core";
import { TracksSelectionPanel } from "./components/TracksSelectionPanel/tracksSelectionPanel";
import { getTracksData } from "./utils";
import { ColumnFilters } from "../../../../../components/ColumnFilters/columnFilters";

export const TracksSelector = ({
  onClose,
  onConfigure,
  open,
  selectedCount,
  stepKey,
  table,
}: Props): JSX.Element => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const onCancel = useCallback(() => {
    table.setRowSelection(rowSelection);
    onClose();
  }, [onClose, rowSelection, table]);

  const onTransitionEnter = useCallback(() => {
    setRowSelection(table.getState().rowSelection);
  }, [table]);

  return (
    <StyledDialog
      onTransitionEnter={onTransitionEnter}
      onClose={onCancel}
      open={open}
    >
      <DialogTitle onClose={onCancel} title="Select Tracks" />
      <DialogContent>
        <ColumnFilters table={table} />
        <TracksSelectionPanel table={table} />
      </DialogContent>
      <DialogActions>
        <Button {...BUTTON_PROPS.SECONDARY_CONTAINED} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={selectedCount === 0}
          onClick={() => {
            onConfigure(getTracksData(table, stepKey));
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
  if (selectedCount === 1) return "Add 1 Track";
  return `Add ${selectedCount} Tracks`;
}
