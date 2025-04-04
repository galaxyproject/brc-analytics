import { Button, TableContainer, Toolbar } from "@mui/material";
import { getCoreRowModel, Table, useReactTable } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/components/TableBody/tableBody";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { COLUMN_IDENTIFIER } from "@databiosphere/findable-ui/lib/components/Table/common/columnIdentifier";
import { StyledPaper } from "./collectionSummary.styles";
import { useMemo } from "react";

export const CollectionSummary = ({
  onEdit,
  table,
}: {
  onEdit: () => void;
  table: Table<ReadRun>;
}): JSX.Element => {
  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original),
    [table]
  );
  const tableInstance = useReactTable({
    _features: [ROW_POSITION, ROW_PREVIEW],
    columns: [
      {
        accessorKey: "run_accession",
        header: "Run accession",
        meta: {
          width: "1fr",
        },
      },
    ],
    data: selectedRows,
    enableRowPosition: false,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility: { [COLUMN_IDENTIFIER.ROW_POSITION]: false },
    },
  });
  return (
    <StyledPaper variant="table">
      <GridPaper>
        <Toolbar variant="table">
          <Button color="secondary" onClick={onEdit} variant="contained">
            Edit list
          </Button>
          <Button color="secondary" onClick={onEdit} variant="contained">
            Clear all
          </Button>
        </Toolbar>
        <TableContainer>
          <GridTable
            gridTemplateColumns={getColumnTrackSizing(
              tableInstance.getVisibleFlatColumns()
            )}
          >
            <TableHead
              rowDirection={ROW_DIRECTION.DEFAULT}
              tableInstance={tableInstance}
            />
            <TableBody
              rowDirection={ROW_DIRECTION.DEFAULT}
              tableInstance={tableInstance}
            />
          </GridTable>
        </TableContainer>
      </GridPaper>
    </StyledPaper>
  );
};
