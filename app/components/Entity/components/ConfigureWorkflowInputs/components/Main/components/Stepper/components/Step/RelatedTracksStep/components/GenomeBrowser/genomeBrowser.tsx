import { JSX } from "react";
import { Fragment } from "react";
import { DataSelector } from "./components/DataSelector/dataSelector";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { TracksSelector } from "./components/TracksSelector/tracksSelector";
import { Props } from "./types";
import { clearTracksData } from "./components/TracksSelector/utils";
import { TracksSummary } from "./components/TracksSummary/tracksSummary";
import { getSelectedTracksCount, getTracksCount } from "./utils";

export const GenomeBrowser = ({
  onConfigure,
  stepKey,
  table,
}: Props): JSX.Element => {
  const relatedTracksDialog = useDialog();
  const selectedCount = getSelectedTracksCount(table);
  return (
    <Fragment>
      <DataSelector
        loading={table.getRowCount() === 0}
        onContinue={relatedTracksDialog.onOpen}
        selectedCount={selectedCount}
        tracksCount={getTracksCount(table)}
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
