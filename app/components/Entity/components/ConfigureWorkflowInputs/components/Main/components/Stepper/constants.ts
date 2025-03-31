import { StepperProps } from "@mui/material";
import { STEPPER_PROPS as MUI_STEPPER_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/stepper";
import { StepConfig } from "./components/Step/types";
import { STEP as REFERENCE_ASSEMBLY_STEP } from "./components/Step/ReferenceAssemblyStep/step";
import { STEP as GTF_STEP } from "./components/Step/GTFStep/step";

export const STEPPER_PROPS: StepperProps = {
  connector: null,
  orientation: MUI_STEPPER_PROPS.ORIENTATION.VERTICAL,
};

export const STEPS: StepConfig[] = [REFERENCE_ASSEMBLY_STEP, GTF_STEP];
