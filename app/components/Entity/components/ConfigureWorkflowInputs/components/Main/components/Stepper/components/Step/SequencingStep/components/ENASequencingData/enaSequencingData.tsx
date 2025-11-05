import { Fragment, useEffect } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Props } from "./types";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";
import { AccessionSelector } from "./components/AccessionSelector/accessionSelector";
import { getSequencingData, clearSequencingData } from "./utils";

export const ENASequencingData = ({
  enaAccession,
  enaTaxonomyId,
  onConfigure,
  setEnaQueryMethod,
  stepKey,
  table,
  taxonomicLevelSpecies,
}: Props): JSX.Element => {
  const accessionDialog = useDialog();
  const collectionDialog = useDialog();
  const selectedCount = Object.values(table.getState().rowSelection).length;

  useEffect(() => {
    onConfigure(getSequencingData(table, stepKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intended behavior to only run on mount.
  }, []);

  return (
    <Fragment>
      <DataSelector
        enaTaxonomyIdStatus={enaTaxonomyId.status}
        onContinue={collectionDialog.onOpen}
        onOpen={accessionDialog.onOpen}
        readCount={enaTaxonomyId.data?.length}
        selectedCount={selectedCount}
        setEnaQueryMethod={setEnaQueryMethod}
        taxonomicLevelSpecies={taxonomicLevelSpecies}
      />
      <AccessionSelector
        clearErrors={enaAccession.clearErrors}
        enaAccessionStatus={enaAccession.status}
        onClose={accessionDialog.onClose}
        onContinue={collectionDialog.onOpen}
        onRequestData={enaAccession.onRequestData}
        open={accessionDialog.open}
        table={table}
      />
      <CollectionSelector
        onClose={collectionDialog.onClose}
        onConfigure={onConfigure}
        open={collectionDialog.open}
        selectedCount={selectedCount}
        table={table}
        stepKey={stepKey}
      />
      <CollectionSummary
        onClear={() => {
          onConfigure(clearSequencingData(stepKey));
          table.resetRowSelection();
          table.resetColumnFilters();
        }}
        onEdit={collectionDialog.onOpen}
        selectedCount={selectedCount}
      />
    </Fragment>
  );
};
