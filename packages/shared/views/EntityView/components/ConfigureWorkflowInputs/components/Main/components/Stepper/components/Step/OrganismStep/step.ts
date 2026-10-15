import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { OrganismStep } from "./organismStep";
import { getOrganismSpecies } from "./utils";

export const STEP = {
  Step: OrganismStep,
  key: "organism",
  label: "Organism",
  renderValue: getOrganismSpecies,
} satisfies StepConfig;
