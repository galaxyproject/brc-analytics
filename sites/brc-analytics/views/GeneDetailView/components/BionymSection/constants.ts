import { SOURCE_KIND } from "@repo/shared/services/genes/constants";
import { type BionymSourceKind } from "@repo/shared/services/genes/types";

// BioNym, which builds the graphs the section's claims are read from.
export const BIONYM_URL = "https://github.com/d-callan/bionym";

// The section's element ID, which the BioNym summary links to. The section
// shows its Claims tab for this hash, as for any hash other than a tab's.
export const BIONYM_SECTION_ID = "bionym";

// The minimum confidence a claim needs to be shown, until the reader moves the
// slider.
export const DEFAULT_MIN_CONFIDENCE = 0.8;

export const SOURCE_KIND_LABEL: Record<BionymSourceKind, string> = {
  [SOURCE_KIND.DATASET]: "Dataset",
  [SOURCE_KIND.PAPER]: "Paper",
};

// The slider's step. Confidences are given to two decimal places.
export const CONFIDENCE_STEP = 0.01;

// The section's tabs, each shown at its URL hash, as #claims or #graph.
export const TAB = {
  CLAIMS: "claims",
  GRAPH: "graph",
} as const;

export const TABS = [
  { label: "Claims", value: TAB.CLAIMS },
  { label: "Graph", value: TAB.GRAPH },
];
