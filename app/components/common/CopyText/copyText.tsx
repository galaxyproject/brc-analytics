import { CopyToClipboard } from "@databiosphere/findable-ui/lib/components/common/CopyToClipboard/copyToClipboard";
import { Grid2, Grid2Props, Typography } from "@mui/material";
import { ReactNode } from "react";

export interface CopyTextProps {
  children: ReactNode;
  gridProps?: Partial<Grid2Props>;
  text: string;
}

export const CopyText = ({
  children,
  gridProps,
  text,
}: CopyTextProps): JSX.Element => {
  return (
    <Grid2 container columnSpacing={1} wrap="nowrap" {...gridProps}>
      <Typography component="span" noWrap>
        {children}
      </Typography>
      <CopyToClipboard copyStr={text} />
    </Grid2>
  );
};
