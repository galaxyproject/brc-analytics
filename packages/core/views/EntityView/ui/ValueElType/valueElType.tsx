import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography, TypographyProps } from "@mui/material";
import { JSX } from "react";

/**
 * Renders a value element type for the KeyValuePairs component.
 * @param props - Props.
 * @returns Value element type.
 */
export const ValueElType = (props: TypographyProps): JSX.Element => {
  return (
    <Typography
      component="span"
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}
      {...props}
    />
  );
};
