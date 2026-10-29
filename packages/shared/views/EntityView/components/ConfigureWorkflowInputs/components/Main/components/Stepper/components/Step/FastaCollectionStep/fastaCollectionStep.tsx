import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button } from "@mui/material";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useWorkflowEntity } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/hook";
import { Fragment, type JSX } from "react";
import { AssembliesData } from "./components/AssembliesData/assembliesData";
import { useTable } from "./components/AssembliesData/components/AssembliesSelector/hooks/UseTable/hook";
import { getFastaCollectionLabel, isFastaCollectionConfigured } from "./utils";

/**
 * Assemblies step component for picking the organism's assemblies a workflow
 * takes as a collection. Continue stays disabled until the workflow's minimum
 * number of assemblies is picked.
 * @param props - Component props.
 * @param props.active - Whether the step is active.
 * @param props.completed - Whether the step is completed.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.disabled - Whether the step is disabled.
 * @param props.entryLabel - Step label.
 * @param props.index - Step index.
 * @param props.last - Whether this is the last step.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.onContinue - Callback to continue to the next step.
 * @param props.onEdit - Callback to edit a completed step.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.workflow - Workflow entity.
 * @returns Assemblies step component.
 */
export const FastaCollectionStep = ({
  active,
  completed,
  configuredInput,
  disabled,
  entryLabel,
  index,
  last,
  onConfigure,
  onContinue,
  onEdit,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const { assemblies } = useWorkflowEntity() ?? {};
  const { table } = useTable(assemblies, workflow);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional>{getFastaCollectionLabel(configuredInput)}</Optional>
              {!disabled && <Button onClick={() => onEdit(index)}>Edit</Button>}
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <AssembliesData
          configuredInput={configuredInput}
          onConfigure={onConfigure}
          stepKey={stepKey}
          table={table}
          workflow={workflow}
        />
        {!last && (
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!isFastaCollectionConfigured(configuredInput, workflow)}
            onClick={() => onContinue()}
          >
            Continue
          </Button>
        )}
      </StepContent>
    </Step>
  );
};
