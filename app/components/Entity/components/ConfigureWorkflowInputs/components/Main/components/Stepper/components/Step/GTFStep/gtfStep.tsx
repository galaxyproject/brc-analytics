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
import { StyledGrid2 } from "./gtfStep.styles";
import { TYPOGRAPHY_PROPS } from "./constants";
import { TYPOGRAPHY_PROPS as MUI_TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { configureGTFStep } from "./utils";
import { BUTTON_PROPS } from "../components/Button/constants";
import { useUCSCFiles } from "./hooks/UseUCSCFiles/hook";
import { useRadioGroup } from "./hooks/UseRadioGroup/hook";
import { useEffect } from "react";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";

export const GTFStep = ({
  active,
  completed,
  description,
  entryKey,
  entryLabel,
  genome,
  index,
  launchStatus,
  onConfigure,
  onLaunch,
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
      <StepLabel>
        {entryLabel}
        <Icon slotProps={{ tooltip: { title: description } }} />
      </StepLabel>
      <StepContent>
        <StyledGrid2>
          <Typography {...TYPOGRAPHY_PROPS}>
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
            <Typography variant={MUI_TYPOGRAPHY_PROPS.VARIANT.TEXT_BODY_400}>
              No gene models found.
            </Typography>
          )}
          <Button
            {...BUTTON_PROPS}
            disabled={launchStatus.disabled || launchStatus.loading}
            onClick={onLaunch}
          >
            Launch Galaxy
          </Button>
        </StyledGrid2>
      </StepContent>
    </Step>
  );
};
