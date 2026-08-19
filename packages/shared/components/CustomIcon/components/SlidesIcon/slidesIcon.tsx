import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import type { SvgIconProps } from "@mui/material";
import { SvgIcon } from "@mui/material";
import { type JSX } from "react";

export const SlidesIcon = ({
  fontSize = SVG_ICON_PROPS.FONT_SIZE.LARGE,
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M6 8H42V11H39V31C39 31.8 38.7 32.5 38.1 33.1C37.5 33.7 36.8 34 36 34H27.5L31.5 40H28L24 34L20 40H16.5L20.5 34H12C11.2 34 10.5 33.7 9.9 33.1C9.3 32.5 9 31.8 9 31V11H6V8ZM12 11V31H36V11H12ZM18 27V19H21V27H18ZM22.5 27V15H25.5V27H22.5ZM27 27V22H30V27H27Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
    </SvgIcon>
  );
};
