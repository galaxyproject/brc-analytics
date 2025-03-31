import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { useEffect } from "react";

export const ReferenceAssemblyStep = ({
  active,
  completed,
  genome,
  index,
  label,
  onConfigure,
}: StepProps): JSX.Element => {
  const { accession } = genome;

  useEffect(() => {
    onConfigure({
      "reference-assembly": {
        label,
        values: [{ key: accession, value: accession }],
      },
    });
  }, [accession, label, onConfigure]);

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel optional={<Optional>{accession}</Optional>}>{label}</StepLabel>
      <StepContent>None</StepContent>
    </Step>
  );
};
