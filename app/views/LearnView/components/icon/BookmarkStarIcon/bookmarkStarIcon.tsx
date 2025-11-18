import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SvgIcon, SvgIconProps } from "@mui/material";

export const BookmarkStarIcon = ({
  fontSize = "large",
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M20.9665 26.6667L23.9998 24.8333L27.0332 26.6667L26.2332 23.2L28.8998 20.9L25.3998 20.6L23.9998 17.3333L22.5998 20.6L19.0998 20.9L21.7665 23.2L20.9665 26.6667ZM14.6665 36V14.111C14.6665 13.511 14.8868 12.9907 15.3275 12.55C15.7684 12.1093 16.2888 11.889 16.8888 11.889H31.1108C31.7108 11.889 32.2313 12.1093 32.6722 12.55C33.1128 12.9907 33.3332 13.511 33.3332 14.111V36L23.9998 32L14.6665 36Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
    </SvgIcon>
  );
};
