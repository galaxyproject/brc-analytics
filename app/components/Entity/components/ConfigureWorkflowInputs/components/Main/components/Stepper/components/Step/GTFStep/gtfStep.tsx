import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Icon } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Label/components/Icon/icon";
import { StepProps } from "../types";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { useUCSCFiles } from "./hooks/UseUCSCFiles/useUCSCFiles";
import { FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useRadioGroup } from "../hooks/UseRadioGroup/hook";
import { StyledGrid2 } from "./gtfStep.styles";
import { TYPOGRAPHY_PROPS } from "./constants";
import { getGeneModelLabel, getInitialValue } from "./utils";
import { useEffect } from "react";

export const GTFStep = ({
  active,
  completed,
  description,
  genome,
  index,
  label,
}: StepProps): JSX.Element => {
  const { geneModelUrls } = useUCSCFiles(genome);
  const { onChange, onValueChange, value } = useRadioGroup("");
  const hasGeneModels = geneModelUrls.length > 0;

  useEffect(() => {
    onValueChange(getInitialValue(geneModelUrls));
  }, [geneModelUrls, onValueChange]);

  return (
    <Step active={active && hasGeneModels} completed={completed} index={index}>
      <StepLabel>
        {label}
        <Icon slotProps={{ tooltip: { title: description } }} />
      </StepLabel>
      <StepContent>
        <StyledGrid2>
          <Typography {...TYPOGRAPHY_PROPS}>
            Genes and Gene Predictions
          </Typography>
          <RadioGroup onChange={onChange} value={value}>
            {geneModelUrls.map((url, index) => (
              <FormControlLabel
                control={<Radio />}
                key={index}
                label={getGeneModelLabel(url)}
                value={url}
              />
            ))}
          </RadioGroup>
        </StyledGrid2>
      </StepContent>
    </Step>
  );
};
