import { Typography } from "@mui/material";
import React from "react";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { CellContext } from "@tanstack/table-core";
import { ReadRun } from "../../../../../../../../types";

export const BasicCell = ({
  getValue,
}: CellContext<ReadRun, ReadRun[keyof ReadRun]>): JSX.Element => {
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.INHERIT}>
      {getValue()}
    </Typography>
  );
};
