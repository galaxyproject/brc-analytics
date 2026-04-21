import { JSX } from "react";
import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SvgIcon, SvgIconProps } from "@mui/material";

export const YouTubeIcon = ({
  fontSize = "large",
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M39.72 14.52C39.36 13.14 38.28 12.06 36.9 11.7C34.38 11.04 24 11.04 24 11.04C24 11.04 13.62 11.04 11.1 11.7C9.72 12.06 8.64 13.14 8.28 14.52C7.62 17.04 7.62 24 7.62 24C7.62 24 7.62 30.96 8.28 33.48C8.64 34.86 9.72 35.94 11.1 36.3C13.62 36.96 24 36.96 24 36.96C24 36.96 34.38 36.96 36.9 36.3C38.28 35.94 39.36 34.86 39.72 33.48C40.38 30.96 40.38 24 40.38 24C40.38 24 40.38 17.04 39.72 14.52ZM20.58 29.58V18.42L29.82 24L20.58 29.58Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
    </SvgIcon>
  );
};
