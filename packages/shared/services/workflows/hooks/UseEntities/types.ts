import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";

export type EntitiesLoader = (config: SiteConfig) => Promise<void>;

export interface UseEntities {
  error?: DataExplorerError;
  isLoaded: boolean;
}
