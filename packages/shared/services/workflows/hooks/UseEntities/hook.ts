import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { useEffect, useState } from "react";
import { ENTITIES_NOT_STARTED } from "./constants";
import { type EntitiesLoader, type UseEntities } from "./types";
import { runEntitiesLoad } from "./utils";

/**
 * Kicks off the one-time entity/workflow cache load and returns its load state
 * per entity list, so consumers share a single load state and a page can wait
 * on just the lists it reads. The site supplies its own loader, keeping the
 * hook agnostic of which entities and workflows are loaded. A failed list is
 * captured as that list's `error` rather than left as an unhandled rejection,
 * so consumers can surface it.
 * @param ensureEntitiesLoaded - Loader that starts the site's entity and
 * workflow loads, returning a load promise per list.
 * @returns Whether the loader has run, and the load state per entity list.
 */
export function useEntities(ensureEntitiesLoaded: EntitiesLoader): UseEntities {
  const [entities, setEntities] = useState<UseEntities>(ENTITIES_NOT_STARTED);

  const config = getConfig();

  useEffect(() => {
    if (!config) return;
    runEntitiesLoad(ensureEntitiesLoaded, config, setEntities);
  }, [config, ensureEntitiesLoaded]);

  return entities;
}
