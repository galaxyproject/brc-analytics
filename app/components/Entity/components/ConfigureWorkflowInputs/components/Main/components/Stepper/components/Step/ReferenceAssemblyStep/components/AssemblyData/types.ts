import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../types";
import { Assembly } from "./components/AssemblySelector/hooks/UseTable/types";

export interface Props extends Pick<
  StepProps,
  "configuredInput" | "onConfigure" | "stepKey"
> {
  table: Table<Assembly>;
}
