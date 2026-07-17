import { Grid, Typography } from "@mui/material";
import { JSX } from "react";
import { ClipboardCopy } from "./components/ClipboardCopy/clipboardCopy";
import { Props } from "./types";

export const CopyText = ({
  children,
  gridProps,
  timeoutDelay,
  tooltipProps,
  value,
}: Props): JSX.Element => {
  return (
    <Grid container columnSpacing={1} wrap="nowrap" {...gridProps}>
      <Typography component="span" noWrap>
        {children}
      </Typography>
      <ClipboardCopy
        timeoutDelay={timeoutDelay}
        tooltipProps={tooltipProps}
        value={value}
      />
    </Grid>
  );
};
