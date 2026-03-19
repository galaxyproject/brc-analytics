import { TableDownload } from "@databiosphere/findable-ui/lib/components/Table/components/TableFeatures/TableDownload/tableDownload";
import {
  StyledStack,
  StyledToolbar,
} from "@databiosphere/findable-ui/lib/components/Table/components/TableToolbar2/tableToolbar2.styles";
import { Divider } from "@mui/material";
import { RowData } from "@tanstack/react-table";
import { Fragment, JSX } from "react";
import { Props } from "../../types";
import { ResultsSummary } from "./components/ResultsSummary/resultsSummary";

/**
 * Table toolbar component with results summary and download action.
 * @param props - Component props.
 * @param props.table - Table instance.
 * @returns Table toolbar component with results summary and download action.
 */
export const TableToolbar = <T extends RowData>({
  table,
}: Props<T>): JSX.Element => {
  return (
    <Fragment>
      <StyledToolbar>
        <ResultsSummary table={table} />
        <StyledStack>
          <TableDownload table={table} />
        </StyledStack>
      </StyledToolbar>
      <Divider />
    </Fragment>
  );
};
