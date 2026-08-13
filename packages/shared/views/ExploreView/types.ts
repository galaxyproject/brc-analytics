import { type Table } from "@tanstack/react-table";
import { type ComponentType } from "react";

export interface ComponentProps<T> {
  table: Table<T>;
}

export interface Props<T> {
  Component: ComponentType<ComponentProps<T>>;
  data: T[];
}
