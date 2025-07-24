import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export interface StepErrorProps {
  error: string | null;
}

export const StepError = ({ error }: StepErrorProps): JSX.Element | null => {
  if (!error) return null;

  return (
    <Typography variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400} color="error">
      Error: {error}
    </Typography>
  );
};
