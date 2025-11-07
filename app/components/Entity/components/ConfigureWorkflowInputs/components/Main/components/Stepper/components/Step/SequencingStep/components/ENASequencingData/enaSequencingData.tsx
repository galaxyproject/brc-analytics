import { Fragment, useEffect } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Props } from "./types";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";
import { AccessionSelector } from "./components/AccessionSelector/accessionSelector";
import {
  getSequencingData,
  clearSequencingData,
  getRowSelectionState,
} from "./utils";

export const ENASequencingData = ({
  configuredInput,
  enaAccessionActions,
  enaAccessionStatus,
  enaTaxonomyId,
  onConfigure,
  selectedCount,
  switchBrowseMethod,
  table,
  taxonomicLevelSpecies,
  taxonomyMatches,
}: Props): JSX.Element => {
  const accessionDialog = useDialog();
  const collectionDialog = useDialog();

  useEffect(() => {
    onConfigure(getSequencingData(table));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intended behavior to only run on mount.
  }, []);

  return (
    <Fragment>
      <DataSelector
        enaTaxonomyIdStatus={enaTaxonomyId.status}
        onContinue={collectionDialog.onOpen}
        onOpen={accessionDialog.onOpen}
        selectedCount={selectedCount}
        taxonomicLevelSpecies={taxonomicLevelSpecies}
        taxonomyCount={enaTaxonomyId.data?.length}
        taxonomyMatches={taxonomyMatches}
      />
      <AccessionSelector
        clearErrors={enaAccessionActions.clearErrors}
        enaAccessionStatus={enaAccessionStatus}
        onClose={accessionDialog.onClose}
        onContinue={collectionDialog.onOpen}
        onRequestData={enaAccessionActions.onRequestData}
        open={accessionDialog.open}
        switchBrowseMethod={switchBrowseMethod}
      />
      <CollectionSelector
        configuredInput={configuredInput}
        onCancel={() => {
          // Restore previous selection.
          table.setRowSelection(getRowSelectionState(configuredInput));
          collectionDialog.onClose();
        }}
        onClose={collectionDialog.onClose}
        onConfigure={onConfigure}
        onTransitionExited={() => {
          if (selectedCount) return;
          switchBrowseMethod();
        }}
        open={collectionDialog.open}
        table={table}
      />
      <CollectionSummary
        onClear={() => {
          // Clear selections and revert to taxonomyId browse method.
          onConfigure(clearSequencingData());
          switchBrowseMethod();
        }}
        onEdit={collectionDialog.onOpen}
        selectedCount={selectedCount}
      />
    </Fragment>
  );
};
