import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Button, Typography } from "@mui/material";
import { Fragment, JSX } from "react";
import { StyledStack } from "../step.styles";
import { StepProps } from "../types";
import { ClassificationTable } from "./components/ClassificationTable/classificationTable";
import { ClassificationValidation } from "./components/ClassificationValidation/classificationValidation";
import { useColumnClassification } from "./hooks/UseColumnClassification/hook";
import { StyledStepContent } from "./sampleSheetClassificationStep.styles";
import { STEP } from "./step";

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
              identifier, a forward and reverse file URL and at least one
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
