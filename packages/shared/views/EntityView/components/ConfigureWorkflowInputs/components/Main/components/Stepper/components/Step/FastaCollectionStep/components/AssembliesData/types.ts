import { type Assembly } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/FastaCollectionStep/components/AssembliesData/components/AssembliesSelector/hooks/UseTable/types";
import { type StepProps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { type Table } from "@tanstack/react-table";

export interface Props extends Pick<
  StepProps,
  "configuredInput" | "onConfigure" | "stepKey" | "workflow"
> {
  table: Table<Assembly>;
}
