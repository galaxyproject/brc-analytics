import { Button, DialogActions, DialogContent } from "@mui/material";
import { StyledDialog } from "./collectionSelector.styles";
import { Props } from "./types";
import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import {
  COLOR,
  VARIANT,
} from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { FormEvent } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table } from "./components/Table/table";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";

export const CollectionSelector = ({
  readRuns,
  onClose,
  open,
}: Props): JSX.Element => {
  const table = useReactTable({
    _features: [ROW_POSITION, ROW_PREVIEW],
    data: readRuns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    columns: [
      {
        header: "Run Accession",
        accessorKey: "run_accession",
      },
      {
        header: "Fastq FTP",
        accessorKey: "fastq_ftp",
      },
      {
        header: "Experiment Accession",
        accessorKey: "experiment_accession",
      },
      {
        header: "Study Accession",
        accessorKey: "study_accession",
      },
      {
        header: "Scientific Name",
        accessorKey: "scientific_name",
      },
      {
        header: "Instrument Platform",
        accessorKey: "instrument_platform",
      },
      {
        header: "Instrument Model",
        accessorKey: "instrument_model",
      },
      {
        header: "Sample Accession",
        accessorKey: "sample_accession",
      },
      {
        header: "Library Strategy",
        accessorKey: "library_strategy",
      },
      {
        header: "Library Layout",
        accessorKey: "library_layout",
      },
      {
        header: "Read Count",
        accessorKey: "read_count",
      },
      {
        header: "Base Count",
        accessorKey: "base_count",
      },
    ],
  });
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
        <Button color={COLOR.PRIMARY} type="submit" variant={VARIANT.CONTAINED}>
          Add Sequencing Run
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};
