import { FormControlLabelProps } from "@mui/material";
import { STRANDEDNESS } from "./types";

export const STRANDEDNESS_LABELS: Record<STRANDEDNESS, string> = {
  [STRANDEDNESS.UNSTRANDED]: "Unstranded",
  [STRANDEDNESS.FORWARD]: "Forward (FR / second-strand)",
  [STRANDEDNESS.REVERSE]: "Reverse (RF / first-strand)",
};

export const CONTROLS: (Pick<FormControlLabelProps, "label" | "value"> & {
  description: string;
})[] = [
  {
    description:
      "Reads come from either strand (e.g. TruSeq RNA Sample Prep Kit). Most common for older datasets.",
    label: STRANDEDNESS_LABELS[STRANDEDNESS.UNSTRANDED],
    value: STRANDEDNESS.UNSTRANDED,
  },
  {
    description:
      "Read 1 is in the same orientation as the transcript (e.g. ligation-based kits like ScriptSeq, SMARTer Stranded).",
    label: STRANDEDNESS_LABELS[STRANDEDNESS.FORWARD],
    value: STRANDEDNESS.FORWARD,
  },
  {
    description:
      "Read 1 is the reverse complement of the transcript (e.g. dUTP-based kits like TruSeq Stranded, NEBNext Directional). Most common for modern stranded data.",
    label: STRANDEDNESS_LABELS[STRANDEDNESS.REVERSE],
    value: STRANDEDNESS.REVERSE,
  },
];
