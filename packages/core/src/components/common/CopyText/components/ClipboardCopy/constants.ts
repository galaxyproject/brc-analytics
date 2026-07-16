import { IconButtonProps, IconProps, TooltipProps } from "@mui/material";

export const ICON_BUTTON_PROPS: Partial<IconButtonProps> = {
  size: "xxsmall",
};

export const ICON_PROPS: Pick<IconProps, "color" | "fontSize"> = {
  color: "primary",
  fontSize: "small",
};

export const TOOLTIP_PROPS: Required<Pick<TooltipProps, "title">> &
  Partial<Omit<TooltipProps, "title">> = {
  arrow: true,
  disableHoverListener: true,
  placement: "top",
  title: "Copied",
};
