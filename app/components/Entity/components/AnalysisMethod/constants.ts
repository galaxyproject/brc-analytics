import { ChipProps, SvgIconProps } from "@mui/material";
import { TEXT_BODY_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { STATUS_BADGE_COLOR } from "@databiosphere/findable-ui/lib/components/common/StatusBadge/statusBadge";

export const CHIP_PROPS: Partial<ChipProps> = {
  color: STATUS_BADGE_COLOR.DEFAULT,
  label: "Coming Soon",
  variant: "status",
};

export const ICON_PROPS: Partial<SvgIconProps> = {
  color: "inkLight",
  fontSize: "medium",
};

export const TYPOGRAPHY_PROPS = {
  color: "ink.light",
  variant: TEXT_BODY_400_2_LINES,
};
