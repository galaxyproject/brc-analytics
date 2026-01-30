import { JSX } from "react";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { useEffect } from "react";
import { STEP } from "./step";

export const ReferenceAssemblyStep = ({
  active,
  completed,
  entryLabel,
  genome,
  index,
  onConfigure,
}: StepProps): JSX.Element => {
  const { accession } = genome;

  useEffect(() => {
    onConfigure({ [STEP.key]: accession });
  }, [accession, entryLabel, onConfigure]);

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel optional={<Optional>{accession}</Optional>}>
        {entryLabel}
      </StepLabel>
      <StepContent>None</StepContent>
    </Step>
  );
};
