import { JSX } from "react";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button } from "@mui/material";
import { Fragment } from "react";
import { StepProps } from "../types";
import { Dropzone } from "./components/Dropzone/dropzone";
import { UploadedFile } from "./components/UploadedFile/uploadedFile";
import { INPUT_PROPS } from "./constants";
import { useFilePicker } from "./hooks/UseFilePicker/hook";
import { StyledGrid } from "./sampleSheetStep.styles";

export const SampleSheetStep = ({
  active,
  completed,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { actions, file, inputRef, validation } = useFilePicker();
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
