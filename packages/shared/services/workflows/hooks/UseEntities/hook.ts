import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { type DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { useEffect, useMemo, useState } from "react";
import { type EntitiesLoader, type UseEntities } from "./types";
import { runEntitiesLoad } from "./utils";

/**
 * Kicks off the one-time entity/workflow cache load and returns its state, so
 * consumers share a single load state. The site supplies its own loader,
 * keeping the hook agnostic of which entities and workflows are loaded. A
 * failed load is captured as `error` rather than left as an unhandled
 * rejection, so consumers can surface it.
 * @param ensureEntitiesLoaded - Loader that resolves once the site's entities
 * and workflows are loaded.
 * @returns Entity cache load state.
 */
export function useEntities(ensureEntitiesLoaded: EntitiesLoader): UseEntities {
  const [error, setError] = useState<DataExplorerError>();
  const [isLoaded, setIsLoaded] = useState(false);

  const config = getConfig();

  useEffect(() => {
    if (!config) return;
    void runEntitiesLoad(ensureEntitiesLoaded, config, setIsLoaded, setError);
  }, [config, ensureEntitiesLoaded]);

  return useMemo(() => ({ error, isLoaded }), [error, isLoaded]);
}
