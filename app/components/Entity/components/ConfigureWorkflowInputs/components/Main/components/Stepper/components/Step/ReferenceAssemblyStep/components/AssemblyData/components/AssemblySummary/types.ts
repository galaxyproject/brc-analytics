import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../../../types";
import { Assembly } from "../AssemblySelector/hooks/UseTable/types";

export interface Props extends Pick<StepProps, "configuredInput"> {
  onEdit: () => void;
  table: Table<Assembly>;
}
