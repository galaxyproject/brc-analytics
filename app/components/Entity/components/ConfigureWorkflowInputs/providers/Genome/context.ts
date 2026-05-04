import { createContext } from "react";
import type { GenomeContextValue } from "./types";

export const GenomeContext = createContext<GenomeContextValue | null>(null);
