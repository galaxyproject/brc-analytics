import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import {
  type EntityLoadState,
  type UseEntities,
} from "@repo/shared/services/workflows/hooks/UseEntities/types";
import { type EntityRoute } from "@repo/shared/services/workflows/types";

/**
 * Combines the load state of the entity lists a page reads: loaded once every
 * one of them is loaded, and failed with the first of them whose load failed.
 * Lists the page doesn't read are ignored, so their load never holds up or
 * fails the page. Once the loader has run, a list it never started counts as
 * failed, so a page waiting on a list the site doesn't load shows an error
 * rather than waiting forever.
 * @param entities - Entity load state.
 * @param entities.isStarted - Whether the loader has run.
 * @param entities.loadStates - Load state per entity list.
 * @param routes - Entity lists the page reads.
 * @returns Combined load state of the page's entity lists.
 */
export function getLoadState(
  { isStarted, loadStates }: UseEntities,
  routes: EntityRoute[]
): EntityLoadState {
  if (!isStarted) return { isLoaded: false };
  const states = routes.map(
    (route) => loadStates[route] ?? getNotStartedState(route)
  );
  return {
    error: states.find((state) => state.error)?.error,
    isLoaded: states.every((state) => state.isLoaded),
  };
}

/**
 * Builds the failed load state of an entity list the loader never started.
 * @param route - Entity list.
 * @returns Failed load state.
 */
function getNotStartedState(route: EntityRoute): EntityLoadState {
  return {
    error: new DataExplorerError(
      new Error(`The ${route} list was not loaded.`)
    ),
    isLoaded: false,
  };
}
