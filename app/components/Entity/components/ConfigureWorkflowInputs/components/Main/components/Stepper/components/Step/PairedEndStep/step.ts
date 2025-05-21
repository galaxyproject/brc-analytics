import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { PairedEndStep } from "./pairedEndStep";

export const STEP: StepConfig = {
  Step: PairedEndStep,
  disabled: false,
  label: "Paired-End Sequencing Data",
  renderValue({ readRuns }) {
    if (readRuns === null) return LABEL.NONE;
    if (readRuns !== undefined)
      return readRuns.map(({ runAccession }) => runAccession).join(", ");
  },
};
