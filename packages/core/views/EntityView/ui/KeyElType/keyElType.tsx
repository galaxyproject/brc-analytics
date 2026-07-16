import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography, TypographyProps } from "@mui/material";
import { JSX } from "react";

/**
 * Renders a key element type for the KeyValuePairs component.
 * @param props - Props.
 * @returns Key element type.
 */
export const KeyElType = (props: TypographyProps): JSX.Element => {
  return (
    <Typography
      component="span"
      color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
      {...props}
    />
  );
};
