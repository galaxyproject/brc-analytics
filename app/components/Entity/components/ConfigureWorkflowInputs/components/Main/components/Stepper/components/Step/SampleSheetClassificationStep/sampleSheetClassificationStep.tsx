import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button, Typography } from "@mui/material";
import { StyledStepContent } from "./sampleSheetClassificationStep.styles";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { useColumnClassification } from "./hooks/UseColumnClassification/hook";
import { ClassificationTable } from "./components/ClassificationTable/classificationTable";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { STEP } from "./step";
import { StyledStack } from "../step.styles";
import { Fragment } from "react";
import { ClassificationValidation } from "./components/ClassificationValidation/classificationValidation";

export const SampleSheetClassificationStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { classifications, onClassify, validation } = useColumnClassification(
    configuredInput.sampleSheet
  );
  return (
    <Fragment>
      <Step active={active} completed={completed} index={index}>
        <StepLabel
          optional={
            completed && <Button onClick={() => onEdit(index)}>Edit</Button>
          }
        >
          {entryLabel}
        </StepLabel>
        <StyledStepContent>
          <StyledStack>
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
              Please assign a column type for all columns and specify one
              identifier, a forward and reverse file path and at least one
              biological factor.
            </Typography>
          </StyledStack>
          <ClassificationTable
            classifications={classifications}
            onClassify={onClassify}
            onConfigure={onConfigure}
          />
          <StyledStack>
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              disabled={!validation.valid}
              onClick={() => {
                onConfigure({ [STEP.key]: classifications });
                onContinue();
              }}
            >
              Continue
            </Button>
          </StyledStack>
        </StyledStepContent>
      </Step>
      <ClassificationValidation
        active={active}
        classifications={classifications}
      />
    </Fragment>
  );
};
