import { StackProps, TypographyProps } from "@mui/material";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const STACK_PROPS: StackProps = {
  alignItems: "center",
  gap: 2,
  useFlexGap: true,
};

export const TYPOGRAPHY_PROPS: TypographyProps = {
  color: MUI_TYPOGRAPHY_PROPS.COLOR.INK_LIGHT,
  noWrap: true,
  variant: MUI_TYPOGRAPHY_PROPS.VARIANT.BODY_400,
};
