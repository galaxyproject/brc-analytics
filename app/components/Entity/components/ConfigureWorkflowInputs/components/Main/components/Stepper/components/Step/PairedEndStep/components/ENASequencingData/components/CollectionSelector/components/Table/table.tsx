import { Table as TanStackTable } from "@tanstack/react-table";
import { ReadRun } from "../../../../types";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/components/TableBody/tableBody";
import { StyledRoundedPaper } from "./table.styles";
import { GridPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { TableContainer } from "@mui/material";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";

export const Table = ({
  table,
}: {
  table: TanStackTable<ReadRun>;
}): JSX.Element => {
  return (
    <StyledRoundedPaper variant="table">
      <GridPaper>
        <TableContainer sx={{ maxHeight: "100%", overflow: "hidden" }}>
          <GridTable
            gridTemplateColumns={getColumnTrackSizing(
              table.getVisibleFlatColumns()
            )}
            stickyHeader
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
    </StyledRoundedPaper>
  );
};
