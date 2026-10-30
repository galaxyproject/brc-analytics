import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type ConfiguredInput } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/types";
import { type Table } from "@tanstack/react-table";
import { type Assembly } from "./hooks/UseTable/types";

export interface Props
  extends
    Pick<ConfiguredInput, "fastaCollection">,
    Pick<StepProps, "onConfigure" | "stepKey" | "workflow"> {
  onClose: () => void;
  open: boolean;
  table: Table<Assembly>;
}
