import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button } from "@mui/material";
import { StyledGrid } from "./sampleSheetStep.styles";
import { Fragment } from "react";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { useFilePicker } from "./hooks/UseFilePicker/hook";
import { INPUT_PROPS } from "./constants";
import { Dropzone } from "./components/Dropzone/dropzone";
import { UploadedFile } from "./components/UploadedFile/uploadedFile";

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
                },
              });
            }}
            ref={inputRef}
          />
          <Dropzone onClick={actions.onClick} />
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
