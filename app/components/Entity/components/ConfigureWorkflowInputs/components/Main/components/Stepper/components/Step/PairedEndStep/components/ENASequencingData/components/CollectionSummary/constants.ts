import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { TypographyProps, PaperProps } from "@mui/material";

export const PAPER_PROPS: PaperProps = {
  elevation: 0,
  square: true,
};

export const TYPOGRAPHY_PROPS: TypographyProps = {
  component: "div",
  variant: MUI_TYPOGRAPHY_PROPS.VARIANT.TEXT_HEADING_XSMALL,
};
