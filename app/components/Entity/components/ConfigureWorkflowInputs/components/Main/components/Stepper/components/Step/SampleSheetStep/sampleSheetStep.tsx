import { Dropzone } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/components/Dropzone/dropzone";
import { UploadedFile } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/components/UploadedFile/uploadedFile";
import { INPUT_PROPS } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/constants";
import { parseFile } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/hooks/UseFilePicker/utils";
import { StyledGrid } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SampleSheetStep/sampleSheetStep.styles";
import { useFilePicker } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseFilePicker/hook";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button } from "@mui/material";
import { Fragment, JSX } from "react";
import { StepProps } from "../types";

export const SampleSheetStep = ({
  active,
  completed,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { actions, file, inputRef, validation } = useFilePicker(parseFile);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional noWrap>{file?.name}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <StyledGrid>
          <input
            {...INPUT_PROPS}
            onChange={(e) => {
              actions.onFileChange(e, {
                onComplete: (rows) => {
                  onConfigure({
                    designFormula: null,
                    primaryContrasts: null,
                    primaryFactor: null,
                    sampleSheet: rows,
                    sampleSheetClassification: undefined,
                  });
                  onContinue();
                },
              });
            }}
            ref={inputRef}
          />
          <Dropzone
            onClick={actions.onClick}
            onDrop={(e) => {
              actions.onDrop(e, {
                onComplete: (rows) => {
                  onConfigure({
                    designFormula: null,
                    primaryContrasts: null,
                    primaryFactor: null,
                    sampleSheet: rows,
                    sampleSheetClassification: undefined,
                  });
                  onContinue();
                },
              });
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
        </StyledGrid>
      </StepContent>
    </Step>
  );
};
