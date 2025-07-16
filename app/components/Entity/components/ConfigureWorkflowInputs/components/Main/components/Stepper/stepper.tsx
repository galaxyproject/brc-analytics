import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";
import { useStepper } from "./hooks/UseStepper/hook";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export const Stepper = ({ workflow, ...props }: Props): JSX.Element => {
  const requiresGTF = workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL
  );
  const requiresFASTQ = workflow.parameters.some(
    (param) =>
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED ||
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE
  );

  let steps = STEPS;
  if (!requiresGTF) {
    steps = steps.filter((step) => step.key !== "geneModelUrl");
  }
  if (!requiresFASTQ) {
    steps = steps.filter((step) => step.key !== "readRuns");
  }
  const { activeStep, onContinue, onEdit } = useStepper(steps);
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {steps.map(({ description, disabled, label, Step }, i) => {
        const active = activeStep === i;
        const completed = activeStep > i;
        return (
          <Step
            key={i}
            active={active}
            completed={completed}
            description={description}
            disabled={disabled}
            entryLabel={label}
            index={i}
            onContinue={onContinue}
            onEdit={onEdit}
            workflow={workflow}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
