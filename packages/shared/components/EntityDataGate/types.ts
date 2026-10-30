import { type EntityRoute } from "@repo/shared/services/workflows/types";
import type { ReactNode } from "react";

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  routes: EntityRoute[];
}
