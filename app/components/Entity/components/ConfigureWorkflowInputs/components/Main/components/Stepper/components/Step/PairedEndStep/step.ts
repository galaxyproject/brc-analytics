import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { PairedEndStep } from "./pairedEndStep";

export const STEP = {
  Step: PairedEndStep,
  disabled: false,
  key: "readRuns",
  label: "Paired-End Sequencing Data",
  renderValue({ readRuns }): string | undefined {
    if (readRuns === null) return LABEL.NONE;
    if (readRuns === undefined) return LABEL.NONE;
    if (readRuns.length === 0) return "User upload to Galaxy";
    return readRuns.map(({ runAccession }) => runAccession).join(", ");
  },
} satisfies StepConfig;
