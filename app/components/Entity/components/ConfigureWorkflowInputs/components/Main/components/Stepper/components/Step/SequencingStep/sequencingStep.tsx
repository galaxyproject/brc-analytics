import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { JSX, useCallback, useEffect } from "react";
import { ToggleButtonGroup } from "../components/ToggleButtonGroup/toggleButtonGroup";
import { useToggleButtonGroup } from "../hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { StepProps } from "../types";
import { useColumnFilters } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseColumnFilters/hook";
import { useRowSelection } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseRowSelection/hook";
import { useTable } from "./components/ENASequencingData/components/CollectionSelector/hooks/UseTable/hook";
import { useRequirementsMatches } from "./components/ENASequencingData/components/CollectionSummary/components/Alert/hooks/UseRequirementsMatches/hook";
import { useTaxonomyMatches } from "./components/ENASequencingData/components/DataSelector/components/Alert/hooks/UseTaxonomyMatches/hook";
import { ENASequencingData } from "./components/ENASequencingData/enaSequencingData";
import { useENADataByAccession } from "./components/ENASequencingData/hooks/UseENADataByAccession/hook";
import { useQuery } from "./components/ENASequencingData/query/hook";
import { BaseReadRun } from "./components/ENASequencingData/types";
import {
  clearSequencingData,
  getSelectedCount,
  getUploadMyOwnSequencingData,
} from "./components/ENASequencingData/utils";
import { TOGGLE_BUTTONS } from "./components/ToggleButtonGroup/toggleButtons";
import { VIEW } from "./components/ToggleButtonGroup/types";
import { UploadMyData } from "./components/UploadMyData/uploadMyData";

export const SequencingStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  initialDataSourceView,
  onConfigure,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const enaAccession = useENADataByAccession<BaseReadRun>();
  const enaTaxonomyId = useQuery();
  const columnFilters = useColumnFilters(workflow, stepKey);
  const rowSelection = useRowSelection(configuredInput);
  const state = { columnFilters, rowSelection };

  // For single-file steps, translate array-based selection output to scalar fields.
  const wrappedOnConfigure: typeof onConfigure = useCallback(
    (partialInput) => {
      if (stepKey === "readRunSingleFile") {
        const runs = partialInput.readRunsSingle;
        if (runs !== undefined) {
          onConfigure({
            readRunSingleFile: runs && runs.length > 0 ? runs[0] : null,
            readRunsSingle: null,
          });
          return;
        }
      }
      if (stepKey === "readRunPairedFile") {
        const runs = partialInput.readRunsPaired;
        if (runs !== undefined) {
          onConfigure({
            readRunPairedFile: runs && runs.length > 0 ? runs[0] : null,
            readRunsPaired: null,
          });
          return;
        }
      }
      onConfigure(partialInput);
    },
    [onConfigure, stepKey]
  );

  const singleSelect =
    stepKey === "readRunSingleFile" || stepKey === "readRunPairedFile";
  const { actions, table } = useTable(
    enaTaxonomyId,
    state,
    wrappedOnConfigure,
    singleSelect
  );
  const initialView =
    initialDataSourceView === VIEW.UPLOAD_MY_DATA
      ? VIEW.UPLOAD_MY_DATA
      : VIEW.ENA;
  const { onChange, value } = useToggleButtonGroup(initialView);
  const { taxonomyMatches } = useTaxonomyMatches(table);
  const { requirementsMatches } = useRequirementsMatches(table);

  useEffect(() => {
    if (initialDataSourceView !== VIEW.UPLOAD_MY_DATA) return;
    // The clear + upload pair is idempotent. Running it on every effect
    // setup matters in dev: React strict-mode runs effect setup twice
    // per mount, and the first ReferenceAssembly setup REPLACES state
    // before the second SequencingStep setup gets a chance to re-seed
    // readRunsPaired from the assistant handoff.
    wrappedOnConfigure(clearSequencingData());
    wrappedOnConfigure(getUploadMyOwnSequencingData(stepKey));
  }, [initialDataSourceView, wrappedOnConfigure, stepKey]);

  return (
    <Step active={active} completed={completed} index={index}>
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup
          onChange={(e, v) => {
            wrappedOnConfigure(clearSequencingData());
            if (v === VIEW.UPLOAD_MY_DATA) {
              wrappedOnConfigure(getUploadMyOwnSequencingData(stepKey));
            }
            onChange?.(e, v);
          }}
          toggleButtons={TOGGLE_BUTTONS}
          value={value}
        />
        {value === VIEW.ENA ? (
          <ENASequencingData
            enaAccessionActions={enaAccession.actions}
            enaAccessionStatus={enaAccession.status}
            enaTaxonomyId={enaTaxonomyId}
            onConfigure={wrappedOnConfigure}
            requirementsMatches={requirementsMatches}
            selectedCount={getSelectedCount(configuredInput)}
            switchBrowseMethod={actions.switchBrowseMethod}
            table={table}
            taxonomyMatches={taxonomyMatches ?? 0}
          />
        ) : (
          <UploadMyData />
        )}
      </StepContent>
    </Step>
  );
};
