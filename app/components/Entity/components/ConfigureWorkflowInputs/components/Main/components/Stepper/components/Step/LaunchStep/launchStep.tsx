import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Button } from "@mui/material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepError } from "../components/StepError/stepError";
import { getStepActiveState, getButtonDisabledState } from "../utils/stepUtils";

export const LaunchStep = ({
  active,
  completed,
  entryLabel,
  index,
  onLaunchGalaxy,
  status,
}: StepProps): JSX.Element => {
  return (
    <Step
      active={getStepActiveState(active, status.loading)}
      completed={completed}
      index={index}
    >
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <StepError error={status.error} />
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          disabled={getButtonDisabledState(
            status.disabled,
            status.loading,
            !!status.error
          )}
          onClick={onLaunchGalaxy}
        >
          Launch In Galaxy
        </Button>
      </StepContent>
    </Step>
  );
};
