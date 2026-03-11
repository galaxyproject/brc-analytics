import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { RowData, Table } from "@tanstack/react-table";
import { JSX } from "react";
import { Props } from "../../../../types";

/**
 * Results summary component displaying table row counts.
 * @param props - Component props.
 * @param props.table - Table instance.
 * @returns Results summary component with row counts or null if no summary function is provided.
 */
export const ResultsSummary = <T extends RowData>({
  table,
}: Props<T>): JSX.Element | null => {
  const { options } = table;
  const { meta } = options;
  const { summaryFn } = (meta || {}) as {
    summaryFn?: (table: Table<T>) => string;
  };

  if (!summaryFn) return null;
  if (typeof summaryFn !== "function") return null;

  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
      {summaryFn(table)}
    </Typography>
  );
};
