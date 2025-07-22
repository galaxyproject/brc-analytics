import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { ToggleButtonGroup } from "./components/ToggleButtonGroup/toggleButtonGroup";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { ENASequencingData } from "./components/ENASequencingData/enaSequencingData";
import { useENA } from "./components/ENASequencingData/hooks/UseENA/hook";
import { ReadRun } from "./components/ENASequencingData/types";
import { useTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/hook";
import { UploadMyData } from "./components/UploadMyData/uploadMyData";

export const SequencingStep = ({
  active,
  completed,
  entryLabel,
  index,
  onConfigure,
  stepKey,
}: StepProps): JSX.Element => {
  const ena = useENA<ReadRun>();
  const table = useTable(ena.data);
  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup onChange={onChange} value={value} />
        {value === VIEW.ENA ? (
          <ENASequencingData
            clearErrors={ena.clearErrors}
            onConfigure={onConfigure}
            onRequestData={ena.onRequestData}
            status={ena.status}
            table={table}
            stepKey={stepKey as "readRunsSingle" | "readRunsPaired"}
          />
        ) : (
          <UploadMyData
            onConfigure={onConfigure}
            stepKey={stepKey as "readRunsSingle" | "readRunsPaired"}
          />
        )}
      </StepContent>
    </Step>
  );
};
