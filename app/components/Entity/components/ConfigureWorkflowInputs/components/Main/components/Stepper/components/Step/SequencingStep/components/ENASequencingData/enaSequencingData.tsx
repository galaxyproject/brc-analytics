import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { RowSelectionState } from "@tanstack/react-table";
import { Fragment, JSX, useRef } from "react";
import { AccessionSelector } from "./components/AccessionSelector/accessionSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { Props } from "./types";
import { clearSequencingData } from "./utils";

export const ENASequencingData = ({
  enaAccessionActions,
  enaAccessionStatus,
  enaTaxonomyId,
  onConfigure,
  requirementsMatches,
  selectedCount,
  switchBrowseMethod,
  table,
  taxonomicLevelSpecies,
  taxonomyMatches,
}: Props): JSX.Element => {
  const accessionDialog = useDialog();
  const collectionDialog = useDialog();
  const rowSelectionRef = useRef<RowSelectionState>({});
  return (
    <Fragment>
      <DataSelector
        enaTaxonomyId={enaTaxonomyId}
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
        onCancel={() => {
          // Revert to previous row selection and close dialog.
          table.setRowSelection(rowSelectionRef.current);
          collectionDialog.onClose();
        }}
        onClose={collectionDialog.onClose}
        onTransitionEnter={() => {
          // Store the current row selection so we can revert to it if the user cancels out of the dialog.
          rowSelectionRef.current = table.getState().rowSelection;
        }}
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
        requirementsMatches={requirementsMatches}
        selectedCount={selectedCount}
      />
    </Fragment>
  );
};
