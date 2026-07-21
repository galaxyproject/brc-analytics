import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import type { SvgIconProps } from "@mui/material";
import { SvgIcon } from "@mui/material";
import { JSX } from "react";

export const SparkleIcon = ({
  fontSize = SVG_ICON_PROPS.FONT_SIZE.LARGE,
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M24 6L26.5 19.5L40 22L26.5 24.5L24 38L21.5 24.5L8 22L21.5 19.5L24 6Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
      <path
        d="M38 6L39.25 12.75L46 14L39.25 15.25L38 22L36.75 15.25L30 14L36.75 12.75L38 6Z"
        fill={PALETTE.PRIMARY_MAIN}
        opacity="0.5"
      />
    </SvgIcon>
  );
};
