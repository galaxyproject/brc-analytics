import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/button/constants";
import { useState } from "react";
import { Table } from "./components/Table/table";
import { RowSelectionState } from "@tanstack/table-core";

export const CollectionSelector = ({
  entryKey,
  entryLabel,
  onClose,
  onConfigure,
  open,
  selectedCount,
  table,
}: Props): JSX.Element => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  return (
    <StyledDialog
      onTransitionEnter={() => setRowSelection(table.getState().rowSelection)}
      open={open}
    >
      <DialogTitle onClose={onClose} title="Select Sequencing Runs" />
      <DialogContent>
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
            const selectedRows = table
              .getSelectedRowModel()
              .rows.map((row) => ({
                key: row.original.fastq_ftp,
                value: row.original.run_accession,
              }));
            onConfigure(entryKey, entryLabel, selectedRows);
            onClose();
          }}
        >
          Add {selectedCount ? selectedCount : ""} Sequencing Run
          {selectedCount > 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
