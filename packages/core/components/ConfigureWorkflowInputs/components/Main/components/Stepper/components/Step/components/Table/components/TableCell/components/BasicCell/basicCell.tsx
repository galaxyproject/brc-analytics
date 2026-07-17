import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { CellContext, RowData } from "@tanstack/react-table";
import { JSX } from "react";

/**
 * Basic cell component rendering a text value.
 * @param props - Component props.
 * @param props.getValue - Accessor to get the cell value.
 * @returns Basic cell component with text value.
 */
export const BasicCell = <T extends RowData>({
  getValue,
}: CellContext<T, unknown>): JSX.Element => {
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.INHERIT}>
      {String(getValue())}
    </Typography>
  );
};
