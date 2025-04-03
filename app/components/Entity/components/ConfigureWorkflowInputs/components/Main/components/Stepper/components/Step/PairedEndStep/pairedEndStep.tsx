import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { Button } from "@mui/material";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { BUTTON_PROPS } from "../components/Button/constants";
import { PairedEndDataSelectorPanel } from "./components/PairedEndDataSelectorPanel/pairedEndDataSelectorPanel";
import { ToggleButtonGroup } from "./components/ToggleButtonGroup/toggleButtonGroup";
import { VIEW } from "./components/ToggleButtonGroup/types";

export const PairedEndStep = ({
  active,
  completed,
  entryLabel,
  index,
  launchStatus,
  onLaunch,
}: StepProps): JSX.Element => {
  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel optional={<Optional>TODO</Optional>}>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup onChange={onChange} value={value} />
        <PairedEndDataSelectorPanel />
        <Button
          {...BUTTON_PROPS}
          disabled={launchStatus.disabled || launchStatus.loading}
          onClick={onLaunch}
        >
          Launch In Galaxy
        </Button>
      </StepContent>
    </Step>
  );
};
