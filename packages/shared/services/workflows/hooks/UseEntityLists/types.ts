import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";

export interface EntityListsState {
  error?: DataExplorerError;
  isLoaded: boolean;
}
