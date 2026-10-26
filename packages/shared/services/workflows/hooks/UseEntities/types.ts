import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { type EntityRoute } from "@repo/shared/services/workflows/types";
import { type Dispatch, type SetStateAction } from "react";

export type EntitiesLoader = (config: SiteConfig) => EntityLoads;

// Entity list -> promise that resolves once that list is loaded.
export type EntityLoads = Partial<Record<EntityRoute, Promise<void>>>;

export interface EntityLoadState {
  error?: DataExplorerError;
  isLoaded: boolean;
}

// Entity list -> its load state, for each list the loader started.
export type EntityLoadStates = Partial<Record<EntityRoute, EntityLoadState>>;

export type SetEntities = Dispatch<SetStateAction<UseEntities>>;

export interface UseEntities {
  // True once the loader has run, so a list with no load state was never
  // started.
  isStarted: boolean;
  loadStates: EntityLoadStates;
}
