import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { ToggleButtonGroup } from "../components/ToggleButtonGroup/toggleButtonGroup";
import { UploadMyData } from "./components/UploadMyData/uploadMyData";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { TOGGLE_BUTTONS } from "./components/ToggleButtonGroup/toggleButtons";
import { Button } from "@mui/material";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Fragment } from "react";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { GenomeBrowser } from "./components/GenomeBrowser/genomeBrowser";
import { useUCSCTracks } from "./hooks/UseUCSCTracks/hook";
import { useTable } from "./components/GenomeBrowser/components/TracksSelector/hooks/UseTable/hook";
import { renderValue } from "./utils";
import { getTracksData } from "./components/GenomeBrowser/components/TracksSelector/utils";

export const RelatedTracksStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  genome,
  index,
  onConfigure,
  onContinue,
  onEdit,
  stepKey,
}: StepProps): JSX.Element => {
  const ucscTracks = useUCSCTracks(genome.accession);
  const table = useTable(ucscTracks);
  const { onChange, value } = useToggleButtonGroup(VIEW.UCSC_GENOME_BROWSER);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel
        optional={
          completed && (
            <Fragment>
              <Optional noWrap>
                {renderValue(configuredInput.tracks)} selected
              </Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <ToggleButtonGroup
          onChange={(e, v) => {
            onChange?.(e, v);
            if (v === VIEW.UCSC_GENOME_BROWSER) {
              onConfigure(getTracksData(table, stepKey));
            } else {
              onConfigure({ [stepKey]: [] });
            }
          }}
          toggleButtons={TOGGLE_BUTTONS}
          value={value}
        />
        {value === VIEW.UCSC_GENOME_BROWSER ? (
          <GenomeBrowser
            onConfigure={onConfigure}
            stepKey={stepKey}
            table={table}
          />
        ) : (
          <UploadMyData />
        )}
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          onClick={() => {
            if (configuredInput.tracks === undefined) {
              // No selection has been made, before continuing configure for "None" selected.
              onConfigure({ [stepKey]: null });
            }
            onContinue();
          }}
        >
          Continue
        </Button>
      </StepContent>
    </Step>
  );
};
