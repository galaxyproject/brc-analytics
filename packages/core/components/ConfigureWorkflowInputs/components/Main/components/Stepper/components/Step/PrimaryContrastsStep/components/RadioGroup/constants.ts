import { CONTRAST_MODE } from "@brc-analytics/core/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/PrimaryContrastsStep/hooks/UseRadioGroup/types";
import { RadioGroupOption } from "./types";

export const OPTIONS: RadioGroupOption[] = [
  {
    description: "Generate all pairwise comparisons between levels",
    label: "Compare All Against All",
    value: CONTRAST_MODE.ALL_AGAINST_ALL,
  },
  {
    description: "Compare each level to a single reference level",
    label: "Compare Against Baseline",
    value: CONTRAST_MODE.BASELINE,
  },
  {
    description: "Manually specify which pairs to compare",
    label: "Explicit Pair(s)",
    value: CONTRAST_MODE.EXPLICIT,
  },
];
