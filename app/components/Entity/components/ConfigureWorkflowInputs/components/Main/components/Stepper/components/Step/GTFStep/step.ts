import { LABEL } from "@databiosphere/findable-ui/lib/apis/azul/common/entities";
import { StepConfig } from "../types";
import { GTFStep } from "./gtfStep";
import { getGeneModelLabel } from "./utils";

export const STEP = {
  Step: GTFStep,
  key: "geneModelUrl",
  label: "GTF Files",
  renderValue({ geneModelUrl }): string | undefined {
    if (geneModelUrl === null) return LABEL.NONE;
    if (geneModelUrl === "") return "User upload to Galaxy";
    if (geneModelUrl !== undefined) return getGeneModelLabel(geneModelUrl);
  },
} satisfies StepConfig;
