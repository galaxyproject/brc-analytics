import { StepConfig } from "../types";
import { AccessionCountStep } from "./accessionCountStep";

export const STEP = {
  Step: AccessionCountStep,
  key: "numberOfHits",
  label: "Accessions to Download",
  renderValue({ numberOfHits }): string | undefined {
    if (numberOfHits !== undefined) return String(numberOfHits);
  },
} satisfies StepConfig;
