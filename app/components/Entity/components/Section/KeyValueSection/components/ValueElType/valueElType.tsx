import { ChildrenProps } from "@databiosphere/findable-ui/lib/components/types";
import { TypographyProps } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";

export const ValueElType = ({
  children,
  ...props /* Mui Typography Props */
}: ChildrenProps & TypographyProps): JSX.Element => {
  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400} {...props}>
      {children}
    </Typography>
  );
};
