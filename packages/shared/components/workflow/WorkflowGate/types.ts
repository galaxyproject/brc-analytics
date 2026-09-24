import type { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import { type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  fallback: ReactNode;
  scopes: readonly WORKFLOW_SCOPE[];
  trsId: string;
}
