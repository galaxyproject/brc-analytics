import { JSX } from "react";
import { Grid, GridProps, Typography } from "@mui/material";
import { ReactNode } from "react";
import {
  ClipboardCopy,
  CopyToClipboardProps,
} from "./components/ClipboardCopy/clipboardCopy";

export interface CopyTextProps extends CopyToClipboardProps {
  children: ReactNode;
  gridProps?: Partial<GridProps>;
}

export const CopyText = ({
  children,
  gridProps,
  timeoutDelay,
  tooltipProps,
  value,
}: CopyTextProps): JSX.Element => {
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
