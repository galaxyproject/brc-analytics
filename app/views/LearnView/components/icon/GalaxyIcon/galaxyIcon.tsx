import { PALETTE } from "@databiosphere/findable-ui/lib/styles/common/constants/palette";
import { SvgIcon, SvgIconProps } from "@mui/material";

export const GalaxyIcon = ({
  fontSize = "large",
  viewBox = "0 0 48 48",
  ...props
}: SvgIconProps): JSX.Element => {
  return (
    <SvgIcon fontSize={fontSize} viewBox={viewBox} {...props}>
      <path
        d="M32.3567 17.5948H6.26356C5.91733 17.5948 5.66553 17.3115 5.66553 16.9967V10.198C5.66553 9.8518 5.94881 9.6 6.26356 9.6H32.3567C32.7029 9.6 32.9547 9.88328 32.9547 10.198V16.9023C32.9547 17.2485 32.7344 17.5948 32.3567 17.5948Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
      <path
        d="M25.3691 28.0761H6.32651C5.98028 28.0761 5.66553 27.7928 5.66553 27.4151V20.7423C5.66553 20.3961 5.94881 20.0813 6.32651 20.0813H25.3691C25.7154 20.0813 26.0301 20.3646 26.0301 20.7423V27.4151C26.0301 27.7928 25.7468 28.0761 25.3691 28.0761Z"
        fill={PALETTE.PRIMARY_MAIN}
      />
      <path
        d="M41.7365 38.4H15.6434C15.2972 38.4 14.9824 38.1167 14.9824 37.739V31.0662C14.9824 30.72 15.2657 30.4052 15.6434 30.4052H41.6736C42.0198 30.4052 42.3346 30.6885 42.3346 31.0662V37.739C42.3346 38.1167 42.0513 38.4 41.7365 38.4Z"
        fill="url(#paint0_linear_3275_4418)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_3275_4418"
          x1="15.0107"
          y1="34.4082"
          x2="42.3767"
          y2="34.4082"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.1656" stopColor={PALETTE.PRIMARY_MAIN} />
          <stop offset="1" stopColor={PALETTE.PRIMARY_MAIN} stopOpacity="0" />
        </linearGradient>
      </defs>
    </SvgIcon>
  );
};
