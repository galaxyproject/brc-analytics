import { StepConfig } from "../types";
import { PrimaryContrastsStep } from "./primaryContrastsStep";

export const STEP = {
  Step: PrimaryContrastsStep,
  key: "primaryContrasts",
  label: "Define Primary Contrasts",
} satisfies StepConfig;
