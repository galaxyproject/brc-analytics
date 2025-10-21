import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { Typography, TypographyProps } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { slugifyHeading } from "../../../../../../../plugins/utils";

export interface HeadingProps {
  component?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  enableAnchor?: boolean;
  headingValue: string;
  headingValueSlug?: string;
  sx?: TypographyProps["sx"];
  variant?: TypographyProps["variant"];
}

export const Heading = ({
  component = "h1",
  enableAnchor = true,
  headingValue,
  headingValueSlug = slugifyHeading(headingValue),
  sx = { mb: 2 },
  variant = TYPOGRAPHY_PROPS.VARIANT.HEADING_LARGE,
}: HeadingProps): JSX.Element => {
  return (
    <Typography
      component={component}
      id={headingValueSlug}
      sx={{ ...sx, position: "relative" }}
      variant={variant}
    >
      {headingValue}
      {enableAnchor && <AnchorLink anchorLink={headingValueSlug} />}
    </Typography>
  );
};
