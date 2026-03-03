import { DialogTitle } from "@databiosphere/findable-ui/lib/components/common/Dialog/components/DialogTitle/dialogTitle";
import { DialogContent } from "@mui/material";
import { JSX, useEffect } from "react";
import { ColumnFilters } from "../../../../../components/ColumnFilters/columnFilters";
import { Table } from "../../../../../components/Table/table";
import { StyledDialog } from "./assemblySelector.styles";
import { Props } from "./types";

/**
 * Assembly selector dialog for browsing and selecting a reference assembly.
 * @param props - Component props.
 * @param props.onClose - Callback to close the dialog.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.open - Whether the dialog is open.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.table - Assembly table instance.
 * @returns Assembly selector dialog component.
 */
export const AssemblySelector = ({
  onClose,
  onConfigure,
  open,
  stepKey,
  table,
}: Props): JSX.Element => {
  const { getState } = table;
  const { rowSelection } = getState();
  const selectedRow = Object.keys(rowSelection).at(0);

  useEffect(() => {
    onConfigure({ [stepKey]: selectedRow });
    if (!selectedRow) return;
    // Delay close to allow the row selection highlight to be visible.
    setTimeout(() => onClose(), 500);
  }, [onClose, onConfigure, selectedRow, stepKey]);

  return (
    <StyledDialog onClose={onClose} open={open}>
      <DialogTitle onClose={onClose} title="Reference Assembly" />
      <DialogContent>
        <ColumnFilters table={table} />
        <Table table={table} />
      </DialogContent>
    </StyledDialog>
  );
};
