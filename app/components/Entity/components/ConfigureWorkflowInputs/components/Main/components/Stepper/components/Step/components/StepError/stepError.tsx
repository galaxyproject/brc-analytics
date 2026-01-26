import { JSX } from "react";
import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface StepErrorProps {
  error: string | null;
}

export const StepError = ({ error }: StepErrorProps): JSX.Element | null => {
  if (!error) return null;

  return (
    <Typography
      color={TYPOGRAPHY_PROPS.COLOR.ERROR}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
    >
      Error: {error}
    </Typography>
  );
};
