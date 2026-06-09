import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { JSX, useCallback, useContext } from "react";
import { HandoffContext } from "../../../../../../../../../../../views/WorkflowInputsView/hooks/UseHandoffSync/context";
import { ToggleButtonGroup } from "../components/ToggleButtonGroup/toggleButtonGroup";
import { StepProps } from "../types";
import { getStepActiveState } from "../utils/stepUtils";
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
import { getToggleButtonValue, translateForSequencingStep } from "./utils";

export const SequencingStep = ({
  active,
  completed,
  configuredInput,
  entryLabel,
  index,
  onConfigure,
  stepKey,
  workflow,
}: StepProps): JSX.Element => {
  const enaAccession = useENADataByAccession<BaseReadRun>();
  const enaTaxonomyId = useQuery();
  const columnFilters = useColumnFilters(workflow, stepKey);
  const rowSelection = useRowSelection(configuredInput);
  const state = { columnFilters, rowSelection };

  const isSingleFileStep = stepKey === "readRunSingleFile";
  const isPairedFileStep = stepKey === "readRunPairedFile";
  const singleSelect = isSingleFileStep || isPairedFileStep;

  const wrappedOnConfigure: typeof onConfigure = useCallback(
    (partialInput) =>
      onConfigure(translateForSequencingStep(partialInput, stepKey)),
    [onConfigure, stepKey]
  );

  const { actions, table } = useTable(
    enaTaxonomyId,
    state,
    wrappedOnConfigure,
    singleSelect
  );
  const value = getToggleButtonValue(configuredInput);
  const { taxonomyMatches } = useTaxonomyMatches(table);
  const { requirementsMatches } = useRequirementsMatches(table);

  const {
    sequencing: {
      status: { isLoading },
    },
  } = useContext(HandoffContext);

  return (
    <Step
      active={getStepActiveState(active, isLoading)}
      completed={completed}
      index={index}
    >
      <Loading loading={isLoading} panelStyle={LOADING_PANEL_STYLE.INHERIT} />
      <StepLabel>{entryLabel}</StepLabel>
      <StepContent>
        <ToggleButtonGroup
          onChange={(_e, v) => {
            // MUI emits null when the user re-clicks the active toggle.
            if (v === null) return;
            wrappedOnConfigure(clearSequencingData());
            if (v === VIEW.UPLOAD_MY_DATA) {
              wrappedOnConfigure(getUploadMyOwnSequencingData(stepKey));
            }
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
