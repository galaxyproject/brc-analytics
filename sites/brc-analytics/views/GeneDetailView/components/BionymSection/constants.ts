// BioNym, which builds the graphs the section's claims are read from.
export const BIONYM_URL = "https://github.com/d-callan/bionym";

// The minimum confidence a claim needs to be shown, until the reader moves the
// slider.
export const DEFAULT_MIN_CONFIDENCE = 0.8;

export const SOURCE_KIND_LABEL = {
  dataset: "Dataset",
  paper: "Paper",
} as const;

// The slider's step. Confidences are given to two decimal places.
export const CONFIDENCE_STEP = 0.01;
