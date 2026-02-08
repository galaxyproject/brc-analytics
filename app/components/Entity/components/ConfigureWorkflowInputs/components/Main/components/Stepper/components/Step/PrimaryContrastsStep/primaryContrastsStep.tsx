import { JSX } from "react";
import { useMemo } from "react";
import { Button, Divider } from "@mui/material";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepProps } from "../types";
import { StyledStack, StyledStepContent } from "./primaryContrastsStep.styles";
import { CompareBaseline } from "./components/CompareBaseline/compareBaseline";
import { ExplicitPairs } from "./components/ExplicitPairs/explicitPairs";
import { RadioGroup } from "./components/RadioGroup/radioGroup";
import { useBaselineContrasts } from "./hooks/UseBaselineContrasts/hook";
import { useExplicitContrasts } from "./hooks/UseExplicitContrasts/hook";
import { usePrimaryContrasts } from "./hooks/UsePrimaryContrasts/hook";
import { CONTRAST_MODE } from "./hooks/UseRadioGroup/types";
import { useRadioGroup } from "../hooks/UseRadioGroup/hook";
import { getUniqueFactorValues } from "./utils";
import { StyledStack as CommonStyledStack } from "../step.styles";
import { Alert } from "./components/Alert/alert";

export const PrimaryContrastsStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const baselineContrasts = useBaselineContrasts(configuredInput.primaryFactor);
  const explicitContrasts = useExplicitContrasts(configuredInput.primaryFactor);
  const radioGroup = useRadioGroup(CONTRAST_MODE.ALL_AGAINST_ALL);

  const factorValues = useMemo(
    () => getUniqueFactorValues(configuredInput),
    [configuredInput]
  );

  const mode = radioGroup.value;

  const { disabled, primaryContrasts } = usePrimaryContrasts(
    mode,
    baselineContrasts,
    explicitContrasts,
    factorValues.length
  );

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && <Button onClick={() => onEdit(index)}>Edit</Button>
        }
      >
        {entryLabel}
      </StepLabel>
      <StyledStepContent>
        <StyledStack gap={1} useFlexGap>
          <RadioGroup {...radioGroup} disabled={factorValues.length < 2} />
          <CompareBaseline
            {...baselineContrasts}
            factorValues={factorValues}
            mode={mode}
          />
          <ExplicitPairs
            {...explicitContrasts}
            factorValues={factorValues}
            mode={mode}
          />
          <Alert
            factorValues={factorValues}
            primaryFactor={configuredInput.primaryFactor}
          />
        </StyledStack>
        <Divider flexItem />
        <CommonStyledStack>
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={disabled}
            onClick={() => {
              onConfigure({ primaryContrasts });
              onContinue();
            }}
          >
            Continue
          </Button>
        </CommonStyledStack>
      </StyledStepContent>
    </Step>
  );
};
