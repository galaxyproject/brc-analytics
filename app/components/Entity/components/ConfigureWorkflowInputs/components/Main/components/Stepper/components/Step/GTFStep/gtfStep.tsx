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
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/button/constants";

export const GTFStep = ({
  active,
  completed,
  description,
  entryKey,
  entryLabel,
  genome,
  index,
  onConfigure,
  onStep,
}: StepProps): JSX.Element => {
  const { geneModelUrls } = useUCSCFiles(genome);
  const { controls, onChange, onValueChange, value } =
    useRadioGroup(geneModelUrls);

  useEffect(() => {
    configureGTFStep(
      geneModelUrls,
      entryKey,
      entryLabel,
      onConfigure,
      onValueChange
    );
  }, [geneModelUrls, entryKey, entryLabel, onConfigure, onValueChange]);

  return (
    <Step
      active={active && !!geneModelUrls}
      completed={completed}
      index={index}
    >
      {/* Step component `children` should be subcomponents such as `StepLabel`, `StepContent`. */}
      {/* We ignore this; the loading UI is in the DOM while `geneModelUrls` is `undefined` and the Step is not `active`. */}
      <Loading
        loading={geneModelUrls === undefined}
        panelStyle={LOADING_PANEL_STYLE.INHERIT}
      />
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional noWrap>{getGeneModelLabel(value)}</Optional>
              <Button onClick={() => onStep(index)}>Edit</Button>
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
          {controls.length > 0 ? (
            <RadioGroup onChange={onChange} value={value}>
              {controls.map(({ label, value }, i) => (
                <FormControlLabel
                  control={<Radio />}
                  key={i}
                  onChange={() =>
                    onConfigure(entryKey, entryLabel, [
                      { key: value, value: label },
                    ])
                  }
                  label={label}
                  value={value}
                />
              ))}
            </RadioGroup>
          ) : (
            <Typography variant={TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400}>
              No gene models found.
            </Typography>
          )}
          <Button
            {...BUTTON_PROPS.PRIMARY_CONTAINED}
            disabled={!value}
            onClick={() => onStep()}
          >
            Continue
          </Button>
        </StyledGrid>
      </StepContent>
    </Step>
  );
};
