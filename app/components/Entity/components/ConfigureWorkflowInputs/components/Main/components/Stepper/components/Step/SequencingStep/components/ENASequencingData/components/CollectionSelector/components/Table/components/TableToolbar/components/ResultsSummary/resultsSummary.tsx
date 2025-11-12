import { Typography } from "@mui/material";
import { Props } from "../../../../types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const ResultsSummary = ({ table }: Props): JSX.Element => {
  const { getPreFilteredRowModel, getRowCount } = table;
  const { rows } = getPreFilteredRowModel();
  const rowCount = getRowCount();
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
      {rowCount} matching run{rowCount === 1 ? "" : "s"} of {rows.length}
    </Typography>
  );
};
