import { type AssemblyContract } from "@repo/shared/apis/types";

export type Assembly = AssemblyContract;

export interface Props {
  entityId: string;
  entityListType?: string;
  trsId: string;
}
