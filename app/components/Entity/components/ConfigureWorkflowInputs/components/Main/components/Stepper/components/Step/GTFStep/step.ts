import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { GTFStep } from "./gtfStep";
import { getGeneModelLabel } from "./utils";

export const STEP: StepConfig = {
  Step: GTFStep,
  label: "GTF Files",
  renderValue({ geneModelUrl }) {
    if (geneModelUrl === null) return LABEL.NONE;
    if (geneModelUrl !== undefined) return getGeneModelLabel(geneModelUrl);
  },
};
