import { createContext } from "react";
import type { WorkflowEntityContextValue } from "./types";

export const WorkflowEntityContext =
  createContext<WorkflowEntityContextValue | null>(null);
