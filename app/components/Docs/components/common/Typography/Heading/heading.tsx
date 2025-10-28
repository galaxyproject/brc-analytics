import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { TypographyProps } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { slugifyHeading } from "@databiosphere/findable-ui/lib/utils/mdx/plugins/utils";
import { StyledTypography } from "./heading.styles";

export interface HeadingProps extends TypographyProps {
  enableAnchor?: boolean;
}

export const Heading = ({
  children,
  enableAnchor = true,
  ...props
}: HeadingProps): JSX.Element => {
  const id = slugifyHeading(String(children));
  return (
    <StyledTypography
      component="h1"
      id={id}
      variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_LARGE}
      {...props}
    >
      {children}
      {enableAnchor && <AnchorLink anchorLink={id} />}
    </StyledTypography>
  );
};
