import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { StepProps } from "../types";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { ToggleButtonGroup } from "./components/ToggleButtonGroup/toggleButtonGroup";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { ENASequencingData } from "./components/ENASequencingData/enaSequencingData";
import { useENADataByAccession } from "./components/ENASequencingData/hooks/UseENADataByAccession/hook";
import { BaseReadRun } from "./components/ENASequencingData/types";
import { useENAByAccessionTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/useENAByAccessionTable";
import { UploadMyData } from "./components/UploadMyData/uploadMyData";
import { ENA_QUERY_METHOD, SEQUENCING_DATA_TYPE } from "./types";
import { useENADataByTaxonomyId } from "./components/ENASequencingData/hooks/UseENADataByTaxonomyId/hook";
import { useState } from "react";
import { useENAByTaxonomyIdTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/useENAByTaxonomyIdTable";

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
  const enaTaxonomyId = useENADataByTaxonomyId<BaseReadRun>(
    workflow,
    genome,
    stepKey as SEQUENCING_DATA_TYPE
  );
  const enaByAccessionTable = useENAByAccessionTable(
    enaQueryMethod,
    enaAccession
  );
  const enaByTaxonomyIdTable = useENAByTaxonomyIdTable(
    enaQueryMethod,
    enaTaxonomyId
  );
  const table =
    enaQueryMethod === ENA_QUERY_METHOD.ACCESSION
      ? enaByAccessionTable
      : enaByTaxonomyIdTable;

  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup onChange={onChange} value={value} />
        {value === VIEW.ENA ? (
          <ENASequencingData
            enaAccession={enaAccession}
            enaTaxonomyId={enaTaxonomyId}
            onConfigure={onConfigure}
            setEnaQueryMethod={setEnaQueryMethod}
            stepKey={stepKey as SEQUENCING_DATA_TYPE}
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
