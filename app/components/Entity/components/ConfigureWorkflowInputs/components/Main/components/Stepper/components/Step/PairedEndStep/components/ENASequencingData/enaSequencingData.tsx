import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Props } from "./types";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";
import { AccessionSelector } from "./components/AccessionSelector/accessionSelector";

export const ENASequencingData = ({
  entryKey,
  entryLabel,
  onConfigure,
  onRequestData,
  requestStatus,
  table,
}: Props): JSX.Element => {
  const accessionDialog = useDialog();
  const collectionDialog = useDialog();
  const isRunSelected = Object.values(table.getState().rowSelection).length > 0;
  return (
    <Fragment>
      <DataSelector
        isRunSelected={isRunSelected}
        onOpen={accessionDialog.onOpen}
      />
      <AccessionSelector
        onClose={accessionDialog.onClose}
        onContinue={collectionDialog.onOpen}
        onRequestData={onRequestData}
        open={accessionDialog.open}
        requestStatus={requestStatus}
      />
      <CollectionSelector
        entryKey={entryKey}
        entryLabel={entryLabel}
        isRunSelected={isRunSelected}
        onClose={collectionDialog.onClose}
        onConfigure={onConfigure}
        open={collectionDialog.open}
        table={table}
      />
      <CollectionSummary
        isRunSelected={isRunSelected}
        onClear={() => {
          onConfigure(entryKey, entryLabel, [{ key: null, value: "None" }]);
          table.resetRowSelection();
        }}
        onEdit={collectionDialog.onOpen}
        table={table}
      />
    </Fragment>
  );
};
