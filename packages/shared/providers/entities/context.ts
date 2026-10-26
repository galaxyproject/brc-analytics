import { ENTITIES_NOT_STARTED } from "@repo/shared/services/workflows/hooks/UseEntities/constants";
import { type UseEntities } from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { createContext } from "react";

export const EntitiesContext = createContext<UseEntities>(ENTITIES_NOT_STARTED);
