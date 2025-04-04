import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { FormEvent } from "react";
import { Table } from "./components/Table/table";

export const CollectionSelector = ({
  entryKey,
  entryLabel,
  onClose,
  onConfigure,
  open,
  table,
}: Props): JSX.Element => {
  return (
    <StyledDialog
      open={open}
      PaperProps={{
        component: "form",
        onSubmit: (event: FormEvent<HTMLFormElement>) => event.preventDefault(),
        sx: {
          boxSizing: "border-box",
          height: "100%",
          margin: "64px 32px",
          maxHeight: "calc(100% - 128px)",
          maxWidth: "calc(100% - 64px)",
          width: "100%",
        },
      }}
    >
      <DialogTitle onClose={onClose} title="Select Sequencing Runs" />
      <DialogContent>
        <Table table={table} />
      </DialogContent>
      <DialogActions>
        <Button
          color={COLOR.SECONDARY}
          onClick={onClose}
          variant={VARIANT.CONTAINED}
        >
          Cancel
        </Button>
        <Button
          color={COLOR.PRIMARY}
          disabled={!table.getIsSomeRowsSelected()}
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
          variant={VARIANT.CONTAINED}
        >
          Add Sequencing Run
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
