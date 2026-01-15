import { IconButtonProps, SelectProps, SvgIconProps } from "@mui/material";
import { SVG_ICON_PROPS as MUI_SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { ICON_BUTTON_PROPS as MUI_ICON_BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/iconButton";

export const ICON_BUTTON_PROPS: IconButtonProps = {
  "aria-label": "Remove selection",
  color: MUI_ICON_BUTTON_PROPS.COLOR.SECONDARY,
};

export const SELECT_PROPS: SelectProps = {
  MenuProps: {
    slotProps: {
      paper: {
        elevation: 1,
        sx: { my: 1 },
        variant: "menu",
      },
    },
  },
  "aria-label": "Select value",
  displayEmpty: true,
  fullWidth: true,
  size: "small",
};

export const SVG_ICON_PROPS: SvgIconProps = {
  color: MUI_SVG_ICON_PROPS.COLOR.INK_LIGHT,
  fontSize: MUI_SVG_ICON_PROPS.FONT_SIZE.SMALL,
};
