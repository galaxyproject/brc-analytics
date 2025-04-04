import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { CollectionSelector } from "./components/CollectionSelector/collectionSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Props } from "./types";
import { CollectionSummary } from "./components/CollectionSummary/collectionSummary";

export const ENASequencingData = ({
  clearErrors,
  entryKey,
  entryLabel,
  onConfigure,
  onRequestData,
  requestStatus,
  table,
}: Props): JSX.Element => {
  const dialogProps = useDialog();
  return (
    <Fragment>
      {table.getIsSomeRowsSelected() && !dialogProps.open ? (
        <CollectionSummary
          onClear={() => {
            table.resetRowSelection();
            onConfigure(entryKey, entryLabel, [{ key: null, value: "None" }]);
          }}
          onEdit={dialogProps.onOpen}
          selectedReadRuns={table
            .getSelectedRowModel()
            .rows.map(({ original }) => original)}
        />
      ) : (
        <DataSelector
          clearErrors={clearErrors}
          requestStatus={requestStatus}
          onRequestData={onRequestData}
          onSelect={dialogProps.onOpen}
        />
      )}
      <CollectionSelector
        entryKey={entryKey}
        entryLabel={entryLabel}
        onConfigure={onConfigure}
        table={table}
        {...dialogProps}
      />
    </Fragment>
  );
};
