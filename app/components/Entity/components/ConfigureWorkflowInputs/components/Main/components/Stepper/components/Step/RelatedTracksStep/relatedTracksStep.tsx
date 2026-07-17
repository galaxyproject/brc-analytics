import { useAssembly } from "@/components/Entity/components/ConfigureWorkflowInputs/providers/Assembly/hook";
import { ToggleButtonGroup } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/ToggleButtonGroup/toggleButtonGroup";
import { useToggleButtonGroup } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { useTable } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/components/TracksSelector/hooks/UseTable/hook";
import { TOGGLE_BUTTONS } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/ToggleButtonGroup/toggleButtons";
import { VIEW } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/ToggleButtonGroup/types";
import { UploadMyData } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/UploadMyData/uploadMyData";
import { useUCSCTracks } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/hooks/UseUCSCTracks/hook";
import { renderValue } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/utils";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { Optional } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/components/Optional/optional";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { Button } from "@mui/material";
import { Fragment, JSX } from "react";
import { StepProps } from "../types";
import { getTracksData } from "./components/GenomeBrowser/components/TracksSelector/utils";
import { GenomeBrowser } from "./components/GenomeBrowser/genomeBrowser";

export const RelatedTracksStep = ({
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
  const assembly = useAssembly();
  const ucscTracks = useUCSCTracks(assembly?.accession);
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
