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

export const RelatedTracksStep = ({
  active,
  completed,
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
              <Optional noWrap>{value}</Optional>
              <Button onClick={() => onEdit(index)}>Edit</Button>
            </Fragment>
          )
        }
      >
        {entryLabel}
      </StepLabel>
      <StepContent>
        <ToggleButtonGroup
          onChange={onChange}
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
          <UploadMyData onConfigure={onConfigure} stepKey={stepKey} />
        )}
        <Button
          {...BUTTON_PROPS.PRIMARY_CONTAINED}
          onClick={() => onContinue()}
        >
          Continue
        </Button>
      </StepContent>
    </Step>
  );
};
