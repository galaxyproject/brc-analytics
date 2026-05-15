import { Workflow } from "../../../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  ConfiguredInput,
  OnConfigure,
} from "../../../../../../views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { Assembly } from "../../../../../../views/WorkflowInputsView/types";
import { VIEW } from "./components/Stepper/components/Step/SequencingStep/components/ToggleButtonGroup/types";
import { StepConfig } from "./components/Stepper/components/Step/types";
import {
  OnContinue,
  OnEdit,
} from "./components/Stepper/hooks/UseStepper/types";

export interface Props {
  activeStep: number;
  configuredInput: ConfiguredInput;
  configuredSteps: StepConfig[];
  genome?: Assembly;
  initialDataSourceView?: VIEW;
  onConfigure: OnConfigure;
  onContinue: OnContinue;
  onEdit: OnEdit;
  workflow: Workflow;
}
