import { getConfig } from "@databiosphere/findable-ui/lib/config/config";
import { DataExplorerError } from "@databiosphere/findable-ui/lib/types/error";
import { loadEntityList } from "@repo/shared/services/workflows/loader";
import { type EntityRoute } from "@repo/shared/services/workflows/types";
import {
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { type EntityListsState } from "./types";

/**
 * Combines the query results of the entity lists a page reads: loaded once
 * every one of them is loaded, and failed with the first of them that failed.
 * @param results - Query result per entity list.
 * @returns Combined load state of the entity lists.
 */
export function combineEntityLists(
  results: UseQueryResult<null>[]
): EntityListsState {
  const failed = results.find((result) => result.isError);
  return {
    error: failed ? toDataExplorerError(failed.error) : undefined,
    isLoaded: results.every((result) => result.isSuccess),
  };
}

/**
 * Loads an entity list into the store for its query. A failure is also
 * logged, so it stays visible in diagnostics where no page reports it, e.g.
 * when the account page labels saved organisms.
 * @param route - Entity list.
 * @returns Null once the list is in the store; the query only tracks its load.
 */
async function fetchEntityList(route: EntityRoute): Promise<null> {
  try {
    await loadEntityList(route, getConfig());
    return null;
  } catch (error) {
    console.error(`Failed to load ${route}:`, error);
    throw error;
  }
}

/**
 * Builds the query that loads one entity list into the store. The list is
 * fetched once and kept for the session: it never goes stale and is never
 * garbage collected, so returning to a page that reads it doesn't download it
 * again. A failed load isn't retried, so the page shows the error straight
 * away. A failed list is loaded again the next time a page that reads it
 * mounts, or, while one is showing, when the window regains focus or the
 * network reconnects, so a page that failed while offline recovers on its own.
 * @param route - Entity list.
 * @returns Query options for the entity list.
 */
export function getEntityListQuery(route: EntityRoute): UseQueryOptions<null> {
  return {
    gcTime: Infinity,
    queryFn: () => fetchEntityList(route),
    queryKey: ["entityList", route],
    retry: false,
    staleTime: Infinity,
  };
}

/**
 * Coerces an unknown error value into a DataExplorerError. Guards against
 * non-Error values, which the DataExplorerError constructor cannot take
 * directly, and passes an existing DataExplorerError through unchanged so its
 * request fields aren't dropped by re-wrapping.
 * @param value - Error value.
 * @returns DataExplorerError wrapping the value.
 */
export function toDataExplorerError(value: unknown): DataExplorerError {
  if (value instanceof DataExplorerError) return value;
  return new DataExplorerError(
    value instanceof Error ? value : new Error(String(value))
  );
}
