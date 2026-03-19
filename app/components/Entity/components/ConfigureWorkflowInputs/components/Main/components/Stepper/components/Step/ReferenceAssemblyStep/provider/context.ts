import { createContext } from "react";
import { StepContextValue } from "./types";

export const StepContext = createContext<StepContextValue | null>(null);
