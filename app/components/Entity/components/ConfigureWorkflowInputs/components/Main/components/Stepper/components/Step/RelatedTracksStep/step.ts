import { StepConfig } from "../types";
import { RelatedTracksStep } from "./relatedTracksStep";
import { renderValue } from "./utils";

export const RELATED_TRACKS_STEP = {
  Step: RelatedTracksStep,
  disabled: false,
  key: "tracks",
  label: "Related Tracks",
  renderValue({ tracks }): string | undefined {
    return renderValue(tracks);
  },
} satisfies StepConfig;
