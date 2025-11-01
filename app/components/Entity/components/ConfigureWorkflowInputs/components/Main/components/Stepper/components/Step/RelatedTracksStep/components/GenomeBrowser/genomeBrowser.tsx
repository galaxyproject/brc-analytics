import { Fragment, useEffect } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { TracksSelector } from "./components/TracksSelector/tracksSelector";
import { Props } from "./types";
import {
  clearTracksData,
  getTracksData,
} from "./components/TracksSelector/utils";
import { TracksSummary } from "./components/TracksSummary/tracksSummary";

export const GenomeBrowser = ({
  onConfigure,
  stepKey,
  table,
}: Props): JSX.Element => {
  const relatedTracksDialog = useDialog();
  const selectedCount = Object.values(table.getState().rowSelection).length;

  useEffect(() => {
    onConfigure(getTracksData(table, stepKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intended behavior to only run on mount.
  }, []);

  return (
    <Fragment>
      <DataSelector
        loading={table.getRowCount() === 0}
        onContinue={relatedTracksDialog.onOpen}
        selectedCount={selectedCount}
        tracksCount={
          table
            .getRowModel()
            .flatRows.filter((r) => r.getCanSelect() && !r.getIsGrouped())
            .length
        }
      />
      <TracksSelector
        onClose={relatedTracksDialog.onClose}
        onConfigure={onConfigure}
        open={relatedTracksDialog.open}
        selectedCount={selectedCount}
        stepKey={stepKey}
        table={table}
      />
      <TracksSummary
        onClear={() => {
          onConfigure(clearTracksData(stepKey));
          table.resetRowSelection();
          table.resetColumnFilters();
        }}
        onEdit={relatedTracksDialog.onOpen}
        selectedCount={selectedCount}
        table={table}
      />
    </Fragment>
  );
};
