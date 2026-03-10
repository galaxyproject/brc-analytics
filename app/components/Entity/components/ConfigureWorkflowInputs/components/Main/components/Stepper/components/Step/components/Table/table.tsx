import { NoResults } from "@databiosphere/findable-ui/lib/components/NoResults/noResults";
import { ROW_DIRECTION } from "@databiosphere/findable-ui/lib/components/Table/common/entities";
import { TableBody } from "@databiosphere/findable-ui/lib/components/Table/components/TableBody/tableBody";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { useVirtualization } from "@databiosphere/findable-ui/lib/components/Table/hooks/UseVirtualization/hook";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { TableContainer } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { TableToolbar } from "./components/TableToolbar/tableToolbar";
import { StyledGrid, StyledRoundedPaper } from "./table.styles";
import { Props } from "./types";

/**
 * Table component used to display tables in the workflow configuration steps.
 * @param props - Component props.
 * @param props.table - Table instance.
 * @returns Table component.
 */
export const Table = <T extends RowData>({ table }: Props<T>): JSX.Element => {
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
