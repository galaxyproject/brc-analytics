import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { createContext } from "react";

export const EntitiesContext = createContext<UseEntities>({ isLoaded: false });
