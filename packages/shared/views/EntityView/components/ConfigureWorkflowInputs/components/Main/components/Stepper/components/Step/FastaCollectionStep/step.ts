import { type StepConfig } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { FastaCollectionStep } from "./fastaCollectionStep";
import { getFastaCollectionLabel } from "./utils";

export const STEP = {
  Step: FastaCollectionStep,
  key: "fastaCollection",
  label: "Assemblies",
  renderValue: getFastaCollectionLabel,
} satisfies StepConfig;
