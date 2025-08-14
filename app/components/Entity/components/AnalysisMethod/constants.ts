import { ChipProps, SvgIconProps, TypographyProps } from "@mui/material";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { SVG_ICON_PROPS as MUI_SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { CHIP_PROPS as MUI_CHIP_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/chip";

export const CHIP_PROPS: Partial<ChipProps> = {
  color: MUI_CHIP_PROPS.COLOR.DEFAULT,
  label: "Coming Soon",
  variant: MUI_CHIP_PROPS.VARIANT.STATUS,
};

export const SVG_ICON_PROPS: Partial<SvgIconProps> = {
  color: MUI_SVG_ICON_PROPS.COLOR.INK_LIGHT,
  fontSize: MUI_SVG_ICON_PROPS.FONT_SIZE.MEDIUM,
};

export const TYPOGRAPHY_PROPS: TypographyProps = {
  color: MUI_TYPOGRAPHY_PROPS.COLOR.INK_LIGHT,
  variant: MUI_TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES,
};
