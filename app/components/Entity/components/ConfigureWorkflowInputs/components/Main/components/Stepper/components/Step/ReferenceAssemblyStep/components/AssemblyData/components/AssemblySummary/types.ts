import { type Assembly } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/types";
import { type StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onEdit: () => void;
  table: Table<Assembly>;
}
