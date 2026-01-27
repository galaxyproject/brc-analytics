import { JSX } from "react";
import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface StepWarningProps {
  error: string | null;
}

export const StepWarning = ({
  error,
}: StepWarningProps): JSX.Element | null => {
  if (!error) return null;

  return (
    <Typography
      color={TYPOGRAPHY_PROPS.COLOR.WARNING}
      variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}
    >
      Warning: Unable to automatically configure this step. You will need to
      provide this data manually. ({error})
    </Typography>
  );
};
