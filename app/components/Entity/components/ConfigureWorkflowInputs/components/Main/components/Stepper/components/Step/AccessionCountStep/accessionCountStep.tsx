import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button, OutlinedInput } from "@mui/material";
import { Fragment, JSX } from "react";
import { StepProps } from "../types";
import { StyledStack } from "./accessionCountStep.styles";
import { useAccessionCount } from "./hooks/UseAccessionCount/hook";

/**
 * Stepper step for configuring the number of accessions to download.
 * Provides a numeric input with a default value of 10.
 * @param props - Component props.
 * @param props.active - Whether this step is currently active.
 * @param props.completed - Whether this step has been completed.
 * @param props.configuredInput - The current configured input values, used to read the existing numberOfHits.
 * @param props.entryLabel - Label for the step entry.
 * @param props.index - Index of the step in the stepper.
 * @param props.onConfigure - Callback invoked with the selected accession count when continuing.
 * @param props.onContinue - Callback to proceed to the next step.
 * @param props.onEdit - Callback to re-enter the step after completion.
 * @returns Accession count step element.
 */
export const AccessionCountStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { disabled, inputValue, numberOfHits, onChange } =
    useAccessionCount(configuredInput);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional>{configuredInput.numberOfHits}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <StyledStack>
          <OutlinedInput
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            onChange={onChange}
            placeholder="Number of accessions"
            value={inputValue}
          />
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={disabled}
            onClick={() => {
              onConfigure({ numberOfHits });
              onContinue();
            }}
          >
            Continue
          </Button>
        </StyledStack>
      </StepContent>
    </Step>
  );
};
