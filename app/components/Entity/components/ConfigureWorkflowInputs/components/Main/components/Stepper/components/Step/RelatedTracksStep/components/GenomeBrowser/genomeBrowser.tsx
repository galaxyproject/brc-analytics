import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { TracksSelector } from "./components/TracksSelector/tracksSelector";
import { Props } from "./types";

export const GenomeBrowser = ({
  onConfigure,
  stepKey,
  table,
}: Props): JSX.Element => {
  const relatedTracksDialog = useDialog();
  const selectedCount = Object.values(table.getState().rowSelection).length;
  return (
    <Fragment>
      <DataSelector
        loading={table.getRowCount() === 0}
        onContinue={relatedTracksDialog.onOpen}
        selectedCount={selectedCount}
        tracksCount={table.getRowCount()}
      />
      <TracksSelector
        onClose={relatedTracksDialog.onClose}
        onConfigure={onConfigure}
        open={relatedTracksDialog.open}
        selectedCount={selectedCount}
        stepKey={stepKey}
        table={table}
      />
    </Fragment>
  );
};
