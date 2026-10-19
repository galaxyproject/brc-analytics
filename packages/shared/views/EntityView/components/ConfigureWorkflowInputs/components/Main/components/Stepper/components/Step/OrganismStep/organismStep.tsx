import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button } from "@mui/material";
import { StepContext } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/providers/SelectorStep/context";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { Fragment, type JSX, useMemo } from "react";
import { useTable } from "./components/OrganismData/components/OrganismSelector/hooks/UseTable/hook";
import { OrganismData } from "./components/OrganismData/organismData";
import { getOrganismSpecies } from "./utils";

/**
 * Organism step component for picking a species when an organism-scoped
 * workflow's taxonomyId is a clade above species. A species is required:
 * Continue stays disabled until one is picked, so the read-run step is always
 * scoped to it.
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
 * @returns Organism step component.
 */
export const OrganismStep = ({
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
  const { table } = useTable(workflow);

  const contextValue = useMemo(
    () => ({ onConfigure, onContinue, stepKey }),
    [onConfigure, onContinue, stepKey]
  );

  return (
    <StepContext.Provider value={contextValue}>
      <Step active={active} completed={completed} index={index}>
        <StepLabel
          optional={
            completed && (
              <Fragment>
                <Optional>{getOrganismSpecies(configuredInput)}</Optional>
                {!disabled && (
                  <Button onClick={() => onEdit(index)}>Edit</Button>
                )}
              </Fragment>
            )
          }
        >
          {entryLabel}
        </StepLabel>
        <StepContent>
          <OrganismData configuredInput={configuredInput} table={table} />
          {!last && (
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              disabled={!configuredInput.organism}
              onClick={() => onContinue()}
            >
              Continue
            </Button>
          )}
        </StepContent>
      </Step>
    </StepContext.Provider>
  );
};
