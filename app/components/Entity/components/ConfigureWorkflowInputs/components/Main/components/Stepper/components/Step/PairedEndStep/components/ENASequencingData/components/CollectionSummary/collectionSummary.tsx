import {
  Button,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
} from "@mui/material";
import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { StyledPaper } from "./collectionSummary.styles";
import { ToolbarActions } from "@databiosphere/findable-ui/lib/components/Table/components/TableToolbar/tableToolbar.styles";
import { Props } from "./types";
import { flexRender } from "@tanstack/react-table";

export const CollectionSummary = ({
  onClear,
  onEdit,
  selectedCount,
  table,
}: Props): JSX.Element | null => {
  const count = Object.keys(table.getState().rowSelection).length;
  if (selectedCount === 0) return null;
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
              table
                .getVisibleFlatColumns()
                .filter((column) => column.id === "run_accession")
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableHead key={headerGroup.id}>
                <TableRow>
                  {headerGroup.headers
                    .filter((header) => header.column.id === "run_accession")
                    .map((header) => (
                      <TableCell key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableCell>
                    ))}
                </TableRow>
              </TableHead>
            ))}
            <TableBody>
              {table.getSelectedRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row
                    .getVisibleCells()
                    .filter((cell) => cell.column.id === "run_accession")
                    .map((cell) => {
                      return (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))}
            </TableBody>
          </GridTable>
        </TableContainer>
      </GridPaper>
    </StyledPaper>
  );
};
