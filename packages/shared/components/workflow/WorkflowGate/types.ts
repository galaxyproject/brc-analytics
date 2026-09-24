import type { WORKFLOW_SCOPE } from "@repo/shared/apis/schema-types";
import { type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  fallback: ReactNode;
  scope: WORKFLOW_SCOPE;
  trsId: string;
}
