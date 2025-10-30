import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { RelatedTracksStep } from "./relatedTracksStep";

export const RELATED_TRACKS_STEP = {
  Step: RelatedTracksStep,
  disabled: false,
  key: "tracks",
  label: "Related Tracks",
  renderValue({ tracks }): string | undefined {
    if (tracks === null) return LABEL.NONE;
    if (tracks === undefined) return undefined;
    if (tracks.length === 0) return "User upload to Galaxy";
    return tracks.map((track) => track).join(", ");
  },
} satisfies StepConfig;
