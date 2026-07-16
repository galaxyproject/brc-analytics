import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography, TypographyProps } from "@mui/material";
import { JSX } from "react";

/**
 * Renders a section title.
 * @param props - Props.
 * @param props.children - Children.
 * @returns Section title.
 */
export const SectionTitle = ({
  children,
  ...props /* MuiTypographyProps */
}: TypographyProps): JSX.Element => {
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL} {...props}>
      {children}
    </Typography>
  );
};
