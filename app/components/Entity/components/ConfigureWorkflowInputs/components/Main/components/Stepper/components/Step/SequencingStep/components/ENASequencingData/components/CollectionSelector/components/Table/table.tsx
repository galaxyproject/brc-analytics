import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Table/components/TableBody/tableBody";
import { StyledGrid } from "./table.styles";
import { StyledRoundedPaper } from "./table.styles";
import { TableContainer } from "@mui/material";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { Props } from "./types";
import { NoResults } from "@databiosphere/findable-ui/lib/components/NoResults/noResults";
import { useVirtualization } from "@databiosphere/findable-ui/lib/components/Table/hooks/UseVirtualization/hook";
import { TableToolbar } from "./components/TableToolbar/tableToolbar";

export const Table = ({ table }: Props): JSX.Element => {
  const { rows, scrollElementRef, virtualizer } = useVirtualization({
    rowDirection: ROW_DIRECTION.DEFAULT,
    table,
  });
  return (
    <StyledGrid container>
      <StyledRoundedPaper elevation={0}>
        <TableToolbar table={table} />
        {table.getRowModel().rows.length === 0 ? (
          <NoResults Paper={null} title="No Results" />
        ) : (
          <TableContainer ref={scrollElementRef}>
            <GridTable
              gridTemplateColumns={getColumnTrackSizing(
                table.getVisibleFlatColumns()
              )}
              stickyHeader
            >
              <TableHead tableInstance={table} />
              <TableBody
                rowDirection={ROW_DIRECTION.DEFAULT}
                rows={rows}
                tableInstance={table}
                virtualizer={virtualizer}
              />
            </GridTable>
          </TableContainer>
        )}
      </StyledRoundedPaper>
    </StyledGrid>
  );
};
