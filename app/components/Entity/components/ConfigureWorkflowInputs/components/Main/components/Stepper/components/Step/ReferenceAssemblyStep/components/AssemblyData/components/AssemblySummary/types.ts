import { StepProps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { Table } from "@tanstack/react-table";
import { Assembly } from "../AssemblySelector/hooks/UseTable/types";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onEdit: () => void;
  table: Table<Assembly>;
}
