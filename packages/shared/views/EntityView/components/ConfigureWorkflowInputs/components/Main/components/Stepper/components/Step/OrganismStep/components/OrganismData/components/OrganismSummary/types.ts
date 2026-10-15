import { type Organism } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/OrganismStep/components/OrganismData/components/OrganismSelector/hooks/UseTable/types";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onEdit: () => void;
  table: Table<Organism>;
}
