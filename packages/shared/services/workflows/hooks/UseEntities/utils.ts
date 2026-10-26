import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { type EntityRoute } from "@repo/shared/services/workflows/types";
import {
  type EntitiesLoader,
  type EntityLoads,
  type EntityLoadState,
  type EntityLoadStates,
  type SetEntities,
} from "./types";

/**
 * Builds a loading state for each list the loader started.
 * @param loads - Load promise per entity list.
 * @returns Loading state per started list.
 */
function getLoadingStates(loads: EntityLoads): EntityLoadStates {
  return Object.fromEntries(
    Object.keys(loads).map((route) => [route, { isLoaded: false }])
  );
}

/**
 * Starts the site's entity and workflow loads and reports their load state:
 * marks the loader as run, with each list it started as loading, then records
 * each list's outcome as that list settles, so a list is marked loaded (or
 * failed) without waiting on the others. A list that already has a state
 * keeps it until its new load settles.
 * @param ensureEntitiesLoaded - Loader that starts the site's entity and
 * workflow loads, returning a load promise per list.
 * @param config - Site config.
 * @param setEntities - Sets the entity load state.
 */
export function runEntitiesLoad(
  ensureEntitiesLoaded: EntitiesLoader,
  config: SiteConfig,
  setEntities: SetEntities
): void {
  const loads = startLoads(ensureEntitiesLoaded, config);
  setEntities((entities) => ({
    isStarted: true,
    loadStates: { ...getLoadingStates(loads), ...entities.loadStates },
  }));
  for (const [route, load] of Object.entries(loads)) {
    void runEntityLoad(route as EntityRoute, load, setEntities);
  }
}

/**
 * Awaits one entity list's load and records the outcome against that list. A
 * failure is also logged, so it stays visible in diagnostics even when no
 * consumer of the load state is mounted. A success replaces the list's state,
 * so a stale error from an earlier attempt never outlives a successful load.
 * @param route - Entity list.
 * @param load - Promise that resolves once the list is loaded.
 * @param setEntities - Sets the entity load state.
 * @returns Promise that resolves once the outcome has been recorded.
 */
async function runEntityLoad(
  route: EntityRoute,
  load: Promise<void>,
  setEntities: SetEntities
): Promise<void> {
  try {
    await load;
    setLoadState(setEntities, route, { isLoaded: true });
  } catch (error) {
    const dataExplorerError = toDataExplorerError(error);
    console.error(`Failed to load ${route}:`, dataExplorerError);
    setLoadState(setEntities, route, {
      error: dataExplorerError,
      isLoaded: false,
    });
  }
}

/**
 * Sets one entity list's load state.
 * @param setEntities - Sets the entity load state.
 * @param route - Entity list.
 * @param loadState - The list's load state.
 */
function setLoadState(
  setEntities: SetEntities,
  route: EntityRoute,
  loadState: EntityLoadState
): void {
  setEntities((entities) => ({
    ...entities,
    loadStates: { ...entities.loadStates, [route]: loadState },
  }));
}

/**
 * Runs the loader to start the site's loads. A loader that throws while
 * starting is logged and starts no lists, so the error doesn't escape the
 * effect; pages that need a list then show it as not loaded.
 * @param ensureEntitiesLoaded - Loader that starts the site's entity and
 * workflow loads.
 * @param config - Site config.
 * @returns Load promise per entity list, or none when the loader threw.
 */
function startLoads(
  ensureEntitiesLoaded: EntitiesLoader,
  config: SiteConfig
): EntityLoads {
  try {
    return ensureEntitiesLoaded(config);
  } catch (error) {
    console.error(
      "Failed to start loading entities:",
      toDataExplorerError(error)
    );
    return {};
  }
}

/**
 * Coerces an unknown rejection value into a DataExplorerError. Guards against
 * non-Error rejection reasons, which the DataExplorerError constructor cannot
 * take directly, and passes an existing DataExplorerError through unchanged so
 * its request fields aren't dropped by re-wrapping.
 * @param value - Rejection value.
 * @returns DataExplorerError wrapping the value.
 */
export function toDataExplorerError(value: unknown): DataExplorerError {
  if (value instanceof DataExplorerError) return value;
  return new DataExplorerError(
    value instanceof Error ? value : new Error(String(value))
  );
}
