import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Icon } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Label/components/Icon/icon";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { Fragment, JSX, useEffect } from "react";
import { StepWarning } from "../components/StepWarning/stepWarning";
import { StepProps } from "../types";
import { getButtonDisabledState, getStepActiveState } from "../utils/stepUtils";
import { StyledGrid } from "./gtfStep.styles";
import { useRadioGroup } from "./hooks/UseRadioGroup/hook";
import { useQuery } from "./query/hook";
import { STEP } from "./step";
import { configureGTFStep, getGeneModelLabel } from "./utils";

export const GTFStep = ({
  active,
  completed,
  description,
  entryLabel,
  genome,
  index,
  last,
  onConfigure,
  onContinue,
  onEdit,
}: StepProps): JSX.Element => {
  const { data, error, isLoading } = useQuery(genome);
  const { controls, onChange, onValueChange, value } = useRadioGroup(data);

  useEffect(() => {
    configureGTFStep(data, onConfigure, onValueChange);
  }, [data, onConfigure, onValueChange]);

  // Auto-configure step with empty string if there's an error
  // Empty string represents "user will provide in Galaxy" similar to how sequencing steps use empty arrays
  useEffect(() => {
    if (error && active) {
      onConfigure({ [STEP.key]: "" }); // Use empty string instead of null
    }
  }, [error, active, onConfigure]);

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
            variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}
          >
            Genes and Gene Predictions
          </Typography>
          <StepWarning error={error} />
          {!error && controls.length > 0 ? (
            <RadioGroup onChange={onChange} value={value}>
              {controls.map(({ label, value }, i) => (
                <FormControlLabel
                  control={<Radio />}
                  key={i}
                  onChange={() => onConfigure({ [STEP.key]: value })}
                  label={label}
                  value={value}
                />
              ))}
            </RadioGroup>
          ) : (
            !error && (
              <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_400}>
                No gene models found.
              </Typography>
            )
          )}
          {!last && (
            <Button
              {...BUTTON_PROPS.PRIMARY_CONTAINED}
              disabled={getButtonDisabledState(!value && !error, isLoading)}
              onClick={() => onContinue()}
            >
              {error ? "Skip This Step" : "Continue"}
            </Button>
          )}
        </StyledGrid>
      </StepContent>
    </Step>
  );
};
