import { Assembly } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/ReferenceAssemblyStep/components/AssemblyData/components/AssemblySelector/hooks/UseTable/types";
import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onEdit: () => void;
  table: Table<Assembly>;
}
