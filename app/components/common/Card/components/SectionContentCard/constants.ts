import { CardProps, StackProps, SvgIconProps } from "@mui/material";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { SVG_ICON_PROPS as MUI_SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";

export const CARD_PROPS: CardProps = {
  component: RoundedPaper,
};

export const STACK_PROPS: StackProps = {
  gap: 1,
  useFlexGap: true,
};

export const SVG_ICON_PROPS: SvgIconProps = {
  color: MUI_SVG_ICON_PROPS.COLOR.PRIMARY,
  fontSize: MUI_SVG_ICON_PROPS.FONT_SIZE.SMALL,
  sx: { gridColumn: 2, gridRow: 1, p: 2.5 },
};

export const TYPOGRAPHY_PROPS = {
  color: MUI_TYPOGRAPHY_PROPS.COLOR.INK_LIGHT,
  variant: MUI_TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES,
};
