import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { Button } from "@mui/material";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { BUTTON_PROPS } from "../components/Button/constants";
import { ToggleButtonGroup } from "./components/ToggleButtonGroup/toggleButtonGroup";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { ENASequencingData } from "./components/ENASequencingData/enaSequencingData";
import { useENA } from "./components/ENASequencingData/hooks/UseENA/useENA";
import { ReadRun } from "./components/ENASequencingData/types";
import { useTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/hook";

export const PairedEndStep = ({
  active,
  completed,
  entryKey,
  entryLabel,
  index,
  launchStatus,
  onConfigure,
  onLaunch,
}: StepProps): JSX.Element => {
  const ena = useENA<ReadRun>();
  const table = useTable(ena.data);
  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel optional={<Optional>TODO</Optional>}>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup onChange={onChange} value={value} />
        {value === VIEW.ENA ? (
          <ENASequencingData
            clearErrors={ena.clearErrors}
            entryKey={entryKey}
            entryLabel={entryLabel}
            onConfigure={onConfigure}
            onRequestData={ena.onRequestData}
            requestStatus={ena.requestStatus}
            table={table}
          />
        ) : null}
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
