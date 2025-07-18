import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Button } from "@mui/material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";

export const LaunchStep = ({
  active,
  completed,
  entryLabel,
  index,
  onLaunchGalaxy,
  status,
}: StepProps): JSX.Element => {
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={status.disabled || status.loading}
          onClick={onLaunchGalaxy}
        >
          Launch In Galaxy
        </Button>
      </StepContent>
    </Step>
  );
};
