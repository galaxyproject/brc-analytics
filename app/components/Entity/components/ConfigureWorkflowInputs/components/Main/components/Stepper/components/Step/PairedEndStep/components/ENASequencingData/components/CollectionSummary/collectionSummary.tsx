import { Button, TableContainer, Toolbar, Typography } from "@mui/material";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ReadRun } from "../../types";
import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/components/TableBody/tableBody";
import { ROW_POSITION } from "@databiosphere/findable-ui/lib/components/Table/features/RowPosition/constants";
import { ROW_PREVIEW } from "@databiosphere/findable-ui/lib/components/Table/features/RowPreview/constants";
import { StyledPaper } from "./collectionSummary.styles";
import { ToolbarActions } from "@databiosphere/findable-ui/lib/components/Table/components/TableToolbar/tableToolbar.styles";

export const CollectionSummary = ({
  onClear,
  onEdit,
  selectedReadRuns,
}: {
  onClear: () => void;
  onEdit: () => void;
  selectedReadRuns: ReadRun[];
}): JSX.Element => {
  const table = useReactTable({
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
    data: selectedReadRuns,
    getCoreRowModel: getCoreRowModel(),
  });
  const count = table.getRowCount();
  return (
    <StyledPaper variant="table">
      <GridPaper>
        <Toolbar variant="table">
          <Typography variant="text-body-400">
            {count} Collection{count > 1 ? "s" : ""} Selected
          </Typography>
          <ToolbarActions>
            <Button color="secondary" onClick={onEdit} variant="contained">
              Edit list
            </Button>
            <Button color="secondary" onClick={onClear} variant="contained">
              Clear all
            </Button>
          </ToolbarActions>
        </Toolbar>
        <TableContainer>
          <GridTable
            gridTemplateColumns={getColumnTrackSizing(
              table.getVisibleFlatColumns()
            )}
          >
            <TableHead
              rowDirection={ROW_DIRECTION.DEFAULT}
              tableInstance={table}
            />
            <TableBody
              rowDirection={ROW_DIRECTION.DEFAULT}
              tableInstance={table}
            />
          </GridTable>
        </TableContainer>
      </GridPaper>
    </StyledPaper>
  );
};
