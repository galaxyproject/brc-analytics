import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Button } from "@mui/material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepWarning } from "../components/StepWarning/stepWarning";
import { getStepActiveState, getButtonDisabledState } from "../utils/stepUtils";

export const LaunchStep = ({
  active,
  completed,
  entryLabel,
  index,
  onContinue,
  onLaunchGalaxy,
  status,
}: StepProps): JSX.Element => {
  // This step doesn't auto-skip on error - user should see the warning

  return (
    <Step
      active={getStepActiveState(active, status.loading)}
      completed={completed}
      index={index}
    >
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <StepWarning error={status.error} />
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={getButtonDisabledState(
            status.disabled && !status.error,
            status.loading
          )}
          onClick={status.error ? onContinue : onLaunchGalaxy}
        >
          {status.error ? "Skip This Step" : "Launch In Galaxy"}
        </Button>
      </StepContent>
    </Step>
  );
};
