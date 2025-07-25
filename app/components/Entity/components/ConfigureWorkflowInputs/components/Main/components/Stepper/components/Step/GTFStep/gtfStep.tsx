import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Icon } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Label/components/Icon/icon";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { StyledGrid } from "./gtfStep.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { configureGTFStep } from "./utils";
import { useUCSCFiles } from "./hooks/UseUCSCFiles/hook";
import { useRadioGroup } from "./hooks/UseRadioGroup/hook";
import { Fragment, useEffect } from "react";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { getGeneModelLabel } from "./utils";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { STEP } from "./step";
import { StepError } from "../components/StepError/stepError";
import { getStepActiveState, getButtonDisabledState } from "../utils/stepUtils";

export const GTFStep = ({
  active,
  completed,
  description,
  entryLabel,
  genome,
  index,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { error, geneModelUrls, isLoading } = useUCSCFiles(genome);
  const { controls, onChange, onValueChange, value } =
    useRadioGroup(geneModelUrls);

  useEffect(() => {
    configureGTFStep(geneModelUrls, onConfigure, onValueChange);
  }, [geneModelUrls, onConfigure, onValueChange]);

  return (
    <Step
      active={getStepActiveState(active, isLoading)}
      completed={completed}
      index={index}
    >
      {/* Step component `children` should be subcomponents such as `StepLabel`, `StepContent`. */}
      {/* We ignore this; the loading UI is in the DOM while `geneModelUrls` is `undefined` and the Step is not `active`. */}
      <Loading loading={isLoading} panelStyle={LOADING_PANEL_STYLE.INHERIT} />
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional noWrap>{getGeneModelLabel(value)}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
        <Icon slotProps={{ tooltip: { title: description } }} />
      </StepLabel>
      <StepContent>
        <StyledGrid>
          <Typography
            component="div"
            variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_500}
          >
            Genes and Gene Predictions
          </Typography>
          <StepError error={error} />
          {!error && controls.length > 0 ? (
            <RadioGroup onChange={onChange} value={value}>
              {controls.map(({ label, value }, i) => (
                <FormControlLabel
                  control={<Radio />}
                  key={i}
                  onChange={() => onConfigure(STEP.key, value)}
                  label={label}
                  value={value}
                />
              ))}
            </RadioGroup>
          ) : (
            !error && (
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400}>
                No gene models found.
              </Typography>
            )
          )}
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={getButtonDisabledState(!value, false, !!error)}
            onClick={() => onContinue()}
          >
            Continue
          </Button>
        </StyledGrid>
      </StepContent>
    </Step>
  );
};
