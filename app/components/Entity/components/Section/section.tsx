import { JSX } from "react";
import { SectionProps } from "./types";
import { Fragment } from "react";
import { Divider } from "@mui/material";
import { Content, StyledTypography } from "./section.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const Section = ({
  children,
  className,
  Paper: PaperComponent,
  title,
}: SectionProps): JSX.Element => {
  const Paper = PaperComponent ?? Fragment;
  const paperProps = PaperComponent ? { className } : {};
  return (
    <Paper {...paperProps}>
      <StyledTypography
        component="h2"
        variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
      >
        {title}
      </StyledTypography>
      <Divider />
      <Content>{children}</Content>
    </Paper>
  );
};
