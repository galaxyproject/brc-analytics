import { Table } from "@tanstack/react-table";
import { StepProps } from "../../../../../types";
import { Assembly } from "./hooks/UseTable/types";

export interface Props extends Pick<StepProps, "onConfigure" | "stepKey"> {
  onClose: () => void;
  open: boolean;
  table: Table<Assembly>;
}
