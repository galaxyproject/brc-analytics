import { JSX } from "react";
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
import { useENADataByTaxonomyId } from "./components/ENASequencingData/hooks/UseENADataByTaxonomyId/hook";
import { TOGGLE_BUTTONS } from "./components/ToggleButtonGroup/toggleButtons";
import { useColumnFilters } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseColumnFilters/hook";
import { getSelectedCount } from "./components/ENASequencingData/utils";
import { useTaxonomyMatches } from "./components/ENASequencingData/components/DataSelector/components/Alert/hooks/UseTaxonomyMatches/hook";
import { useRequirementsMatches } from "./components/ENASequencingData/components/CollectionSummary/components/Alert/hooks/UseRequirementsMatches/hook";

export const SequencingStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  genome,
  index,
  onConfigure,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const enaAccession = useENADataByAccession<BaseReadRun>();
  const enaTaxonomyId = useENADataByTaxonomyId<BaseReadRun>(genome);
  const columnFilters = useColumnFilters(workflow, stepKey);
  const { actions, table } = useTable(enaTaxonomyId, columnFilters);
  const { onChange, value } = useToggleButtonGroup(VIEW.ENA);
  const { taxonomyMatches } = useTaxonomyMatches(table);
  const { requirementsMatches } = useRequirementsMatches(table, genome);
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
            configuredInput={configuredInput}
            enaAccessionActions={enaAccession.actions}
            enaAccessionStatus={enaAccession.status}
            enaTaxonomyId={enaTaxonomyId}
            onConfigure={onConfigure}
            requirementsMatches={requirementsMatches}
            selectedCount={getSelectedCount(configuredInput)}
            switchBrowseMethod={actions.switchBrowseMethod}
            table={table}
            taxonomicLevelSpecies={genome.taxonomicLevelSpecies}
            taxonomyMatches={taxonomyMatches ?? 0}
          />
        ) : (
          <UploadMyData onConfigure={onConfigure} stepKey={stepKey} />
        )}
      </StepContent>
    </Step>
  );
};
