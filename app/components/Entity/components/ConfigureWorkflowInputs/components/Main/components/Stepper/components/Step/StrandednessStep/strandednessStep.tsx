import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { RadioCheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioCheckedIcon/radioCheckedIcon";
import { RadioUncheckedIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/RadioUncheckedIcon/radioUncheckedIcon";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { SVG_ICON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/svgIcon";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { Fragment, JSX, useEffect } from "react";
import { useRadioGroup } from "../hooks/UseRadioGroup/hook";
import { StepProps } from "../types";
import { CONTROLS } from "./constants";
import { StyledStepContent } from "./strandednessStep.styles";
import { STRANDEDNESS } from "./types";
import { getStepLabel } from "./utils";

export const StrandednessStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  onContinue,
  onEdit,
  stepKey,
}: StepProps): JSX.Element => {
  const { strandedness } = configuredInput;
  const { onChange, value } = useRadioGroup(
    strandedness ?? STRANDEDNESS.UNSTRANDED
  );

  useEffect(() => {
    if (!active) return;
    onConfigure({ [stepKey]: value });
  }, [active, onConfigure, stepKey, value]);

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional>{getStepLabel(strandedness)}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StyledStepContent>
        <RadioGroup onChange={onChange} value={value}>
          {CONTROLS.map(({ description, label, value }, i) => (
            <FormControlLabel
              control={
                <Radio
                  checkedIcon={
                    <RadioCheckedIcon
                      fontSize={SVG_ICON_PROPS.FONT_SIZE.XSMALL}
                    />
                  }
                  icon={
                    <RadioUncheckedIcon
                      fontSize={SVG_ICON_PROPS.FONT_SIZE.XSMALL}
                    />
                  }
                  size="small"
                />
              }
              key={i}
              label={
                <Stack useFlexGap>
                  <span>{label}</span>
                  <Typography
                    color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                    variant={TYPOGRAPHY_PROPS.VARIANT.BODY_SMALL_400}
                  >
                    {description}
                  </Typography>
                </Stack>
              }
              value={value}
            />
          ))}
        </RadioGroup>
        <Button {...BUTTON_PROPS.PRIMARY_CONTAINED} onClick={onContinue}>
          Continue
        </Button>
      </StyledStepContent>
    </Step>
  );
};
