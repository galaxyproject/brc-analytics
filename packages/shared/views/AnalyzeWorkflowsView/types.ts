import { type AssemblyContract } from "@repo/shared/apis/types";
import { type ComponentType } from "react";

export interface Props<T extends AssemblyContract = AssemblyContract> {
  entityId: string;
  SideComponent: ComponentType<{ assembly: T }>;
}
