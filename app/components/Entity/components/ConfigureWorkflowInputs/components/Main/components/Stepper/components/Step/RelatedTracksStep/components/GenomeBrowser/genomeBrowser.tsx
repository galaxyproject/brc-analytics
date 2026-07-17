import { DataSelector } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/components/DataSelector/dataSelector";
import { TracksSummary } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/components/TracksSummary/tracksSummary";
import {
  getSelectedTracksCount,
  getTracksCount,
} from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/components/GenomeBrowser/utils";
import { useDialog } from "@databiosphere/findable-ui/lib/components/common/Dialog/hooks/useDialog";
import { Fragment, JSX } from "react";
import { TracksSelector } from "./components/TracksSelector/tracksSelector";
import { clearTracksData } from "./components/TracksSelector/utils";
import { Props } from "./types";

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
