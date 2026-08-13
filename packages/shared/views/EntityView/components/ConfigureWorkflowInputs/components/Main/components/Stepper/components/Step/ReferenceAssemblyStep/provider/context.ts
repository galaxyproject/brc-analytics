import { createContext } from "react";
import { type StepContextValue } from "./types";

export const StepContext = createContext<StepContextValue | null>(null);
