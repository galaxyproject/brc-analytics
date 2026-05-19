import { TableBody } from "@databiosphere/findable-ui/lib/components/Table/components/TableBody/tableBody";
import { TableHead } from "@databiosphere/findable-ui/lib/components/Table/components/TableHead/tableHead";
import { useVirtualization } from "@databiosphere/findable-ui/lib/components/Table/hooks/UseVirtualization/hook";
import { GridTable } from "@databiosphere/findable-ui/lib/components/Table/table.styles";
import { getColumnTrackSizing } from "@databiosphere/findable-ui/lib/components/TableCreator/options/columnTrackSizing/utils";
import { TableContainer } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { JSX } from "react";
import { useRowDirection } from "./hooks/UseRowDirection/hook";
import { Props } from "./types";

/**
 * Renders a virtualized table for a TanStack Table instance, with responsive
 * row direction (horizontal on default viewports, vertical on small viewports).
 * @param props - Component props.
 * @param props.table - Table instance.
 * @returns Table component.
 */
export const Table = <T extends RowData>({ table }: Props<T>): JSX.Element => {
  const { rowDirection } = useRowDirection();
  const { rows, scrollElementRef, virtualizer } = useVirtualization({
    rowDirection,
    table,
  });
  return (
    <TableContainer ref={scrollElementRef}>
      <GridTable
        gridTemplateColumns={getColumnTrackSizing(
          table.getVisibleFlatColumns()
        )}
        collapsable
      >
        <TableHead tableInstance={table} />
        <TableBody
          rowDirection={rowDirection}
          rows={rows}
          tableInstance={table}
          virtualizer={virtualizer}
        />
      </GridTable>
    </TableContainer>
  );
};
