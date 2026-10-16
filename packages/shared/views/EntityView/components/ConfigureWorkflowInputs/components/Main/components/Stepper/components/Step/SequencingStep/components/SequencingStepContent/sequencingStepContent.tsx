import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { StepContent } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepContent/stepContent";
import { StepLabel } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/components/StepLabel/stepLabel";
import { Step } from "@databiosphere/findable-ui/lib/components/Stepper/components/Step/step";
import { HandoffStatusContext } from "@repo/shared/providers/workflowHandoff/contexts/HandoffStatus/context";
import { ToggleButtonGroup } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/components/ToggleButtonGroup/toggleButtonGroup";
import { useToggleButtonGroup } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/hooks/UseToggleButtonGroup/useToggleButtonGroup";
import { useColumnFilters } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseColumnFilters/hook";
import { useRowSelection } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseRowSelection/hook";
import { useTable } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSelector/hooks/UseTable/hook";
import { useRequirementsMatches } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/CollectionSummary/components/Alert/hooks/UseRequirementsMatches/hook";
import { useTaxonomyMatches } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/components/DataSelector/components/Alert/hooks/UseTaxonomyMatches/hook";
import { ENASequencingData } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/enaSequencingData";
import { useENADataByAccession } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/hooks/UseENADataByAccession/hook";
import { useQuery } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/query/hook";
import { type BaseReadRun } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/types";
import {
  clearSequencingData,
  getSelectedCount,
  getUploadMyOwnSequencingData,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ENASequencingData/utils";
import { TOGGLE_BUTTONS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ToggleButtonGroup/toggleButtons";
import { VIEW } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/ToggleButtonGroup/types";
import { UploadMyData } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/components/UploadMyData/uploadMyData";
import {
  areReadRunsCleared,
  getInitialToggleValue,
  translateForSequencingStep,
} from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/SequencingStep/utils";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { getStepActiveState } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/utils/stepUtils";
import { type JSX, useCallback, useContext } from "react";

/**
 * Sequencing step body: the ENA / upload toggle, the ENA read-run picker and its
 * alerts. Rendered by `SequencingStep`, which remounts it when the workflow
 * entity's taxon changes.
 * @param props - Step props.
 * @param props.active - Whether the step is active.
 * @param props.completed - Whether the step is completed.
 * @param props.configuredInput - Configured workflow inputs.
 * @param props.entryLabel - Step label.
 * @param props.index - Step index.
 * @param props.onConfigure - Callback to configure workflow input.
 * @param props.stepKey - Key identifying the configured input field.
 * @param props.workflow - Workflow entity.
 * @returns Sequencing step content.
 */
export const SequencingStepContent = ({
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
  const { onChange, value: rawValue } = useToggleButtonGroup(
    getInitialToggleValue(configuredInput)
  );
  // After an assembly re-pick wipes via DEFAULT_CONFIGURED_INPUT, every
  // read-run field is undefined — force the toggle back to ENA so its
  // internal state can't show stale UPLOAD from before the wipe.
  const value = areReadRunsCleared(configuredInput) ? VIEW.ENA : rawValue;
  const { taxonomyMatches } = useTaxonomyMatches(table);
  const { requirementsMatches } = useRequirementsMatches(table);

  const {
    sequencing: {
      status: { isLoading },
    },
  } = useContext(HandoffStatusContext);

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
            taxonomyMatches={taxonomyMatches}
          />
        ) : (
          <UploadMyData />
        )}
      </StepContent>
    </Step>
  );
};
