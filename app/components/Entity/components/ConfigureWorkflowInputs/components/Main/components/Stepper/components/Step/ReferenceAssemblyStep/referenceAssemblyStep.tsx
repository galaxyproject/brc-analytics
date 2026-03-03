import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button } from "@mui/material";
import { Fragment, JSX, useEffect, useMemo } from "react";
import { StepProps } from "../types";
import { AssemblyData } from "./components/AssemblyData/assemblyData";
import { useTable } from "./components/AssemblyData/components/AssemblySelector/hooks/UseTable/hook";
import { StepContext } from "./provider/context";

/**
 * Reference assembly step component for workflow configuration.
 * @param props - Component props.
 * @param props.active - Whether the step is active.
 * @param props.completed - Whether the step is completed.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.disabled - Whether the step is disabled.
 * @param props.entryLabel - Step label.
 * @param props.genome - Pre-configured genome assembly.
 * @param props.index - Step index.
 * @param props.last - Whether this is the last step.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.onContinue - Callback to continue to the next step.
 * @param props.onEdit - Callback to edit a completed step.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.workflow - Workflow entity.
 * @returns Reference assembly step component.
 */
export const ReferenceAssemblyStep = ({
  active,
  completed,
  configuredInput,
  disabled,
  entryLabel,
  genome,
  index,
  last,
  onConfigure,
  onContinue,
  onEdit,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const { accession } = genome || {};
  const { table } = useTable(workflow);

  const contextValue = useMemo(
    () => ({ onConfigure, onContinue, stepKey }),
    [onConfigure, onContinue, stepKey]
  );

  useEffect(() => {
    if (!accession) return;
    // Some workflows may have a reference assembly pre-configured.
    // In this case, we want to populate the step with that assembly on mount.
    onConfigure({ [stepKey]: accession });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intended behavior to only run on mount, not when accession changes.
  }, [onConfigure]);

  return (
    <StepContext.Provider value={contextValue}>
      <Step active={active} completed={completed} index={index}>
        <StepLabel
          optional={
            completed && (
              <Fragment>
                <Optional>{configuredInput.referenceAssembly}</Optional>
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
          <AssemblyData configuredInput={configuredInput} table={table} />
          {!last && (
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              disabled={!configuredInput.referenceAssembly}
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
