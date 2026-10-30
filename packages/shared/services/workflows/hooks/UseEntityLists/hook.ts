import { type EntityRoute } from "@repo/shared/services/workflows/types";
import { useQueries } from "@tanstack/react-query";
import { type EntityListsState } from "./types";
import { combineEntityLists, getEntityListQuery } from "./utils";

/**
 * Loads the given entity lists into the store and returns their combined load
 * state. Each list is a query, so pages that read the same list share one
 * load, and a list is only downloaded once a page that reads it mounts.
 * @param routes - Entity lists to load.
 * @returns Whether every list is loaded, and the first load error, if any.
 */
export function useEntityLists(routes: EntityRoute[]): EntityListsState {
  return useQueries({
    combine: combineEntityLists,
    queries: routes.map(getEntityListQuery),
  });
}
