import { STEPPER_PROPS, STEPS } from "./constants";
import { StyledStepper } from "./stepper.styles";
import { Props } from "./types";
import { useStepper } from "./hooks/UseStepper/hook";
import { WORKFLOW_PARAMETER_VARIABLE } from "../../../../../../../../apis/catalog/brc-analytics-catalog/common/schema-entities";

export const Stepper = ({ workflow, ...props }: Props): JSX.Element => {
  const requiresGTF = workflow.parameters.some(
    (param) => param.variable === WORKFLOW_PARAMETER_VARIABLE.GENE_MODEL_URL
  );
  const requiresReadRunSingle = workflow.parameters.some(
    (param) =>
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_SINGLE
  );
  const requiresReadRunPaired = workflow.parameters.some(
    (param) =>
      param.variable === WORKFLOW_PARAMETER_VARIABLE.SANGER_READ_RUN_PAIRED
  );

  let steps = STEPS;
  if (!requiresGTF) {
    steps = steps.filter((step) => step.key !== "geneModelUrl");
  }
  if (!requiresReadRunSingle) {
    steps = steps.filter((step) => step.key !== "readRunsSingle");
  }
  if (!requiresReadRunPaired) {
    steps = steps.filter((step) => step.key !== "readRunsPaired");
  }
  const { activeStep, onContinue, onEdit } = useStepper(steps);
  return (
    <StyledStepper activeStep={activeStep} {...STEPPER_PROPS}>
      {steps.map(({ description, disabled, key, label, Step }, i) => {
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
            stepKey={key}
            workflow={workflow}
            {...props}
          />
        );
      })}
    </StyledStepper>
  );
};
