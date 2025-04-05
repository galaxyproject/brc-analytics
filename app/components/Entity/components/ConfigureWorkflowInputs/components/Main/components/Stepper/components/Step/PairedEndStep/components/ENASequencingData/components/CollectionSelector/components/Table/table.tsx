import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Detail/components/Table/components/TableBody/tableBody";
import { StyledRoundedPaper } from "./table.styles";
import { TableContainer } from "@mui/material";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { Props } from "./types";

export const Table = ({ table }: Props): JSX.Element => {
  return (
    <StyledRoundedPaper variant="table">
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
    </StyledRoundedPaper>
  );
};
