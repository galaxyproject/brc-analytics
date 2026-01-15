import { useMemo } from "react";
import { Button, Divider } from "@mui/material";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepProps } from "../types";
import { StyledStepContent } from "./primaryContrastsStep.styles";
import { STEP } from "./step";
import { RadioGroup } from "./components/RadioGroup/radioGroup";
import { ExplicitPairs } from "./components/ExplicitPairs/explicitPairs";
import { useExplicitContrasts } from "./hooks/UseExplicitContrasts/hook";
import { getUniqueFactorValues } from "./utils";
import { getValidPairs } from "./hooks/UseExplicitContrasts/utils";
import { useRadioGroup } from "../hooks/UseRadioGroup/hook";
import { CONTRAST_MODE } from "./hooks/UseRadioGroup/types";
import { StyledStack } from "../step.styles";

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
  const radioGroup = useRadioGroup(CONTRAST_MODE.EXPLICIT);

  const factorValues = useMemo(
    () => getUniqueFactorValues(configuredInput),
    [configuredInput]
  );

  const { onAddPair, onRemovePair, onUpdatePair, pairs, valid } =
    useExplicitContrasts(configuredInput.primaryFactor);

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
        <StyledStack gap={6} useFlexGap>
          {/* Contrast Mode Selector */}
          <RadioGroup {...radioGroup} />
          <ExplicitPairs
            factorValues={factorValues}
            mode={radioGroup.value}
            onAddPair={onAddPair}
            onRemovePair={onRemovePair}
            onUpdatePair={onUpdatePair}
            pairs={pairs}
          />
        </StyledStack>
        <Divider flexItem />
        <StyledStack>
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!valid}
            onClick={() => {
              onConfigure({
                [STEP.key]: {
                  pairs: getValidPairs(pairs),
                  type: radioGroup.value,
                },
              });
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
