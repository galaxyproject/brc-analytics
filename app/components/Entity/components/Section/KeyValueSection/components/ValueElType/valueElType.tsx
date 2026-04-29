import { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography, TypographyProps } from "@mui/material";
import { JSX } from "react";

export const ValueElType = ({
  children,
  ...props /* Mui Typography Props */
}: ChildrenProps & TypographyProps): JSX.Element => {
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400} {...props}>
      {children}
    </Typography>
  );
};
