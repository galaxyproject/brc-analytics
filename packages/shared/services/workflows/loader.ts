import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";
import { type EntitiesLoader } from "./hooks/UseEntities/types";
import { API } from "./routes";
import { getEntitiesById, setEntitiesById, setEntitiesByType } from "./store";
import type { EntityGetId, EntityRoute } from "./types";

/**
 * Creates a single-flight entities loader: concurrent and repeat calls share
 * one in-flight load, and a rejected load is dropped from the memo so a later
 * call re-attempts instead of returning the cached failure forever.
 * @param load - Loader that resolves once the site's entities and workflows are loaded.
 * @returns Memoized loader.
 */
export function createEntitiesLoader(load: EntitiesLoader): EntitiesLoader {
  let loadPromise: Promise<void> | null = null;
  return (config: SiteConfig): Promise<void> => {
    loadPromise ??= load(config).catch((error) => {
      loadPromise = null;
      throw error;
    });
    return loadPromise;
  };
}

/**
 * Fetches entities from the API.
 * @param url - URL.
 * @returns Entity list.
 */
export async function fetchEntities(url: string): Promise<unknown[]> {
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);

  return (await res.json()) as unknown[];
}

/**
 * Checks if the route is an entity route.
 * @param route - Route.
 * @returns True if the route is an entity route; false otherwise.
 */
function isEntityRoute(route: string): route is EntityRoute {
  return Object.hasOwn(API, route);
}

/**
 * Loads the entities store with entities from the API, fetching every entity
 * list at once. Skips routes not in the API, workflows (which `loadWorkflows`
 * loads), lists already loaded, and entity configs with no getId. Each route is
 * loaded once, by the first entity config for it that has a getId. Each list is
 * stored as soon as it arrives, and a failed fetch is only reported once every
 * fetch has settled, so the lists that loaded stay loaded and a retry fetches
 * only the rest.
 * @param config - Site config.
 * @returns Promise that resolves once every entity list is loaded, or rejects
 * once every fetch has settled, with the failure of the first entity list (in
 * config order) that failed.
 */
export async function loadEntities(config: SiteConfig): Promise<void> {
  const getIdByRoute = new Map<EntityRoute, EntityGetId>();
  for (const { getId, route } of config.entities) {
    if (!isEntityRoute(route)) continue;

    // Workflows are loaded by loadWorkflows: their API payload is workflow
    // categories, not entities keyed by getId.
    if (route === "workflows") continue;

    // Entities are already loaded; skip.
    if (getEntitiesById().has(route)) continue;

    // Get id function is not configured; entities are excluded from preloading.
    if (!getId) continue;

    // The route is loaded by the first config for it with a getId.
    if (!getIdByRoute.has(route)) getIdByRoute.set(route, getId);
  }
  await settleAll(
    [...getIdByRoute].map(([route, getId]) => loadEntityList(route, getId))
  );
}

/**
 * Fetches one entity list and stores it, by id and as a list.
 * @param route - Entity route.
 * @param getId - Returns an entity's id.
 */
async function loadEntityList(
  route: EntityRoute,
  getId: EntityGetId
): Promise<void> {
  const entities = await fetchEntities(API[route]);

  const entityById = new Map<string, unknown>();
  for (const entity of entities) entityById.set(getId(entity), entity);

  setEntitiesById(route, entityById);
  setEntitiesByType(route, entities);
}

/**
 * Loads the workflows store with workflows from the API, plus any additional
 * workflows supplied by the caller.
 * @param extraWorkflows - Additional workflows to add to the store, keyed by their URL-formatted trsId.
 * @throws If two workflows with different trsIds share a URL-formatted trsId.
 */
export async function loadWorkflows(
  extraWorkflows: Workflow[] = []
): Promise<void> {
  if (getEntitiesById().has("workflows")) return;

  const workflowCategories = (await fetchEntities(
    API.workflows
  )) as WorkflowCategory[];

  setEntitiesById(
    "workflows",
    indexWorkflowsById(workflowCategories, extraWorkflows)
  );
  setEntitiesByType("workflows", workflowCategories);
}

/**
 * Waits for every load to settle, then rejects with the first failure (in the
 * order given), if any. Unlike `Promise.all`, a failure is not reported while
 * other loads are still running, so a caller that retries on failure (such as
 * a `createEntitiesLoader` loader) never starts a download that is already in
 * flight.
 * @param loads - Loads.
 * @returns Promise that resolves once every load has succeeded, or rejects once
 * every load has settled, with the first failure.
 */
export async function settleAll(loads: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(loads);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );
  if (failure) throw failure.reason;
}
