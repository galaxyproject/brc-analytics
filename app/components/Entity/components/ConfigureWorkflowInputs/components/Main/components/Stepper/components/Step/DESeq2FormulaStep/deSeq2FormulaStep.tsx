import { JSX } from "react";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button, Typography } from "@mui/material";
import { StyledStepContent } from "./deSeq2FormulaStep.styles";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { STEP } from "./step";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Table } from "./components/Table/table";
import { Alert } from "./components/Alert/alert";
import { useFormulaSelection } from "./hooks/UseFormulaSelection/hook";
import { Fragment } from "react";
import { StyledStack } from "../step.styles";

export const DESeq2FormulaStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const {
    columns,
    formula,
    onSelectPrimary,
    onToggleCovariate,
    selection,
    valid,
  } = useFormulaSelection(configuredInput.sampleSheetClassification);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional>{configuredInput.designFormula}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StyledStepContent>
        <StyledStack>
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400_2_LINES}>
            Select one primary factor and zero or more covariates.
          </Typography>
        </StyledStack>
        <Table
          columns={columns}
          onConfigure={onConfigure}
          onSelectPrimary={onSelectPrimary}
          onToggleCovariate={onToggleCovariate}
          selection={selection}
        />
        <StyledStack gap={6} useFlexGap>
          <Alert formula={formula} />
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!valid}
            onClick={() => {
              onConfigure({ [STEP.key]: formula });
              onContinue();
            }}
          >
            Continue
          </Button>
        </StyledStack>
      </StyledStepContent>
    </Step>
  );
};
