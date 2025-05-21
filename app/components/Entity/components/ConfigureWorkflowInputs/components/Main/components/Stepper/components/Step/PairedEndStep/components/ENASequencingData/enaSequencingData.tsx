import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Props } from "./types";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";
import { AccessionSelector } from "./components/AccessionSelector/accessionSelector";

export const ENASequencingData = ({
  clearErrors,
  onConfigure,
  onRequestData,
  status,
  table,
}: Props): JSX.Element => {
  const accessionDialog = useDialog();
  const collectionDialog = useDialog();
  const selectedCount = Object.values(table.getState().rowSelection).length;
  return (
    <Fragment>
      <DataSelector
        onOpen={accessionDialog.onOpen}
        selectedCount={selectedCount}
      />
      <AccessionSelector
        clearErrors={clearErrors}
        onClose={accessionDialog.onClose}
        onContinue={collectionDialog.onOpen}
        onRequestData={onRequestData}
        open={accessionDialog.open}
        status={status}
      />
      <CollectionSelector
        onClose={collectionDialog.onClose}
        onConfigure={onConfigure}
        open={collectionDialog.open}
        selectedCount={selectedCount}
        table={table}
      />
      <CollectionSummary
        onClear={() => {
          onConfigure("readRuns", null);
          table.resetRowSelection();
        }}
        onEdit={collectionDialog.onOpen}
        selectedCount={selectedCount}
        table={table}
      />
    </Fragment>
  );
};
