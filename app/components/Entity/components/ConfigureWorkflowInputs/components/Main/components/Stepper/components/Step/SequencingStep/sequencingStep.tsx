import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { ToggleButtonGroup } from "../components/ToggleButtonGroup/toggleButtonGroup";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { ENASequencingData } from "./components/ENASequencingData/enaSequencingData";
import { useENADataByAccession } from "./components/ENASequencingData/hooks/UseENADataByAccession/hook";
import { BaseReadRun } from "./components/ENASequencingData/types";
import { useTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/hook";
import { UploadMyData } from "./components/UploadMyData/uploadMyData";
import { ENA_QUERY_METHOD, SEQUENCING_DATA_TYPE } from "./types";
import { useENADataByTaxonomyId } from "./components/ENASequencingData/hooks/UseENADataByTaxonomyId/hook";
import { useState } from "react";
import { TOGGLE_BUTTONS } from "./components/ToggleButtonGroup/toggleButtons";
import { useColumnFilters } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseColumnFilters/hook";

export const SequencingStep = ({
  active,
  completed,
  entryLabel,
  genome,
  index,
  onConfigure,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const [enaQueryMethod, setEnaQueryMethod] = useState<ENA_QUERY_METHOD>(
    ENA_QUERY_METHOD.ACCESSION
  );
  const enaAccession = useENADataByAccession<BaseReadRun>();
  const enaTaxonomyId = useENADataByTaxonomyId<BaseReadRun>(genome);
  const columnFilters = useColumnFilters(workflow, stepKey);
  const { actions, table } = useTable(
    enaQueryMethod,
    enaAccession,
    enaTaxonomyId,
    columnFilters
  );
  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup
          onChange={onChange}
          toggleButtons={TOGGLE_BUTTONS}
          value={value}
        />
        {value === VIEW.ENA ? (
          <ENASequencingData
            enaAccessionActions={enaAccession.actions}
            enaAccessionStatus={enaAccession.status}
            enaTaxonomyId={enaTaxonomyId}
            onConfigure={onConfigure}
            setEnaQueryMethod={setEnaQueryMethod}
            stepKey={stepKey as SEQUENCING_DATA_TYPE}
            switchToAccession={actions.switchToAccession}
            table={table}
            taxonomicLevelSpecies={genome.taxonomicLevelSpecies}
          />
        ) : (
          <UploadMyData
            onConfigure={onConfigure}
            stepKey={stepKey as SEQUENCING_DATA_TYPE}
          />
        )}
      </StepContent>
    </Step>
  );
};
