import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { FormEvent, useState } from "react";
import { Table } from "./components/Table/table";
import { RowSelectionState } from "@tanstack/table-core";

export const CollectionSelector = ({
  entryKey,
  entryLabel,
  isRunSelected,
  onClose,
  onConfigure,
  open,
  table,
}: Props): JSX.Element => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  return (
    <StyledDialog
      onTransitionEnter={() => setRowSelection(table.getState().rowSelection)}
      open={open}
      PaperProps={{
        component: "form",
        onSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
      }}
    >
      <DialogTitle onClose={onClose} title="Select Sequencing Runs" />
      <DialogContent>
        <Table table={table} />
      </DialogContent>
      <DialogActions>
        <Button
          color={COLOR.SECONDARY}
          onClick={() => {
            table.setRowSelection(rowSelection);
            onClose();
          }}
          variant={VARIANT.CONTAINED}
        >
          Cancel
        </Button>
        <Button
          color={COLOR.PRIMARY}
          disabled={!isRunSelected}
          onClick={() => {
            const selectedRows = table
              .getSelectedRowModel()
              .rows.map((row) => ({
                key: row.original.fastq_ftp,
                value: row.original.run_accession,
              })); // TODO potentially combine multiple runs into `;` separated string?
            onConfigure(entryKey, entryLabel, selectedRows);
            onClose();
          }}
          variant={VARIANT.CONTAINED}
        >
          Add Sequencing Run
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
