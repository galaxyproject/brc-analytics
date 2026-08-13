import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import type { SvgIconProps } from "@mui/material";
import { SvgIcon } from "@mui/material";
import { type JSX } from "react";

export const ArticleIcon = ({
  fontSize = SVG_ICON_PROPS.FONT_SIZE.LARGE,
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M15.85 32.5H32.15V29.5H15.85V32.5ZM15.85 25.35H32.15V22.35H15.85V25.35ZM15.85 18.2H32.15V15.2H15.85V18.2ZM9 42C8.2 42 7.5 41.7 6.9 41.1C6.3 40.5 6 39.8 6 39V9C6 8.2 6.3 7.5 6.9 6.9C7.5 6.3 8.2 6 9 6H39C39.8 6 40.5 6.3 41.1 6.9C41.7 7.5 42 8.2 42 9V39C42 39.8 41.7 40.5 41.1 41.1C40.5 41.7 39.8 42 39 42H9Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
    </SvgIcon>
  );
};
