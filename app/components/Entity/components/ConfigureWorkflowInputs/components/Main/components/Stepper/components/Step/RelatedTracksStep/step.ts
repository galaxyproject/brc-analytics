import { renderValue } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/RelatedTracksStep/utils";
import { StepConfig } from "../types";
import { RelatedTracksStep } from "./relatedTracksStep";

export const RELATED_TRACKS_STEP = {
  Step: RelatedTracksStep,
  disabled: false,
  key: "tracks",
  label: "Related Tracks",
  renderValue({ tracks }): string | undefined {
    return renderValue(tracks);
  },
} satisfies StepConfig;
