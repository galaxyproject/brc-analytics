import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button } from "@mui/material";
import { Fragment, JSX, useCallback } from "react";
import { UploadedFile } from "../SampleSheetStep/components/UploadedFile/uploadedFile";
import { StepProps } from "../types";
import { Dropzone } from "./components/Dropzone/dropzone";
import { INPUT_PROPS } from "./constants";
import { useFilePicker } from "../hooks/UseFilePicker/hook";
import { readFastaFile } from "./hooks/UseFilePicker/utils";
import { StyledStack } from "./sequenceStep.styles";

/**
 * Stepper step for uploading a FASTA sequence file.
 * Provides a file picker (click or drag-and-drop), validates the file as FASTA,
 * and configures the sequence and file name on the workflow input.
 * @param props - Component props.
 * @param props.active - Whether this step is currently active.
 * @param props.completed - Whether this step has been completed.
 * @param props.configuredInput - The current configured input values, used to read the sequence file name.
 * @param props.entryLabel - Label for the step entry.
 * @param props.index - Index of the step in the stepper.
 * @param props.onConfigure - Callback invoked with the sequence and file name when configuration is complete.
 * @param props.onContinue - Callback to proceed to the next step after successful configuration.
 * @param props.onEdit - Callback to edit the step after completion.
 * @returns Sequence step element.
 */
export const SequenceStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { actions, file, inputRef, validation } = useFilePicker(readFastaFile);

  const onComplete = useCallback(
    (sequence: string, file: File): void => {
      onConfigure({ sequence, sequenceFileName: file.name });
      onContinue();
    },
    [onConfigure, onContinue]
  );

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional noWrap>{configuredInput.sequenceFileName}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <StyledStack>
          <input
            {...INPUT_PROPS}
            onChange={(e) => {
              actions.onFileChange(e, { onComplete });
            }}
            ref={inputRef}
          />
          <Dropzone
            onClick={actions.onClick}
            onDrop={(e) => {
              actions.onDrop(e, { onComplete });
            }}
          />
          <UploadedFile
            errors={validation.errors}
            file={file}
            onClear={actions.onClear}
          />
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!validation.valid}
            onClick={onContinue}
          >
            Continue
          </Button>
        </StyledStack>
      </StepContent>
    </Step>
  );
};
