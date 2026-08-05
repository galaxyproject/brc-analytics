import { createContext } from "react";
import type { AssemblyContextValue } from "./types";

export const AssemblyContext = createContext<AssemblyContextValue | null>(null);
