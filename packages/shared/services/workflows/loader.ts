import type {
  EntityConfig,
  SiteConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";
import {
  type EntitiesLoader,
  type EntityLoads,
} from "./hooks/UseEntities/types";
import { API } from "./routes";
import { getEntitiesById, setEntitiesById, setEntitiesByType } from "./store";
import type { EntityRoute } from "./types";

/**
 * Creates a single-flight entities loader: concurrent and repeat calls share
 * one set of in-flight loads, and when any list's load rejects the set is
 * dropped from the memo, so a later call re-attempts instead of returning the
 * cached failure forever. Lists that finished loading are already in the
 * store, so a re-attempt skips them.
 * @param load - Loader that starts the site's entity and workflow loads.
 * @returns Memoized loader.
 */
export function createEntitiesLoader(load: EntitiesLoader): EntitiesLoader {
  let loads: EntityLoads | null = null;
  return (config: SiteConfig): EntityLoads => {
    if (loads) return loads;
    const current = load(config);
    loads = current;
    for (const entityLoad of Object.values(current)) {
      entityLoad.catch(() => {
        if (loads === current) loads = null;
      });
    }
    return current;
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
export function isEntityRoute(route: string): route is EntityRoute {
  return Object.hasOwn(API, route);
}

/**
 * Starts loading the entities store with entities from the API, fetching the
 * entity lists in parallel. Skips routes not in the API, workflows (which
 * `loadWorkflows` loads), and entity configs with no getId. A list already
 * loaded gets a resolved promise rather than a refetch.
 * @param config - Site config.
 * @returns Load promise per entity list, each resolving once that list is
 * stored, or rejecting with its fetch failure.
 */
export function loadEntities(config: SiteConfig): EntityLoads {
  const loads: EntityLoads = {};
  for (const { getId, route } of config.entities) {
    if (!isEntityRoute(route)) continue;

    // Workflows are loaded by loadWorkflows: their API payload is workflow
    // categories, not entities keyed by getId.
    if (route === "workflows") continue;

    // Entities are already loaded; nothing to fetch.
    if (getEntitiesById().has(route)) {
      loads[route] = Promise.resolve();
      continue;
    }

    // Get id function is not configured; entities are excluded from preloading.
    if (!getId) continue;

    loads[route] = loadEntityList(route, getId);
  }
  return loads;
}

/**
 * Fetches one entity list and stores it, by id and as a list.
 * @param route - Entity route.
 * @param getId - Returns an entity's id.
 */
async function loadEntityList(
  route: EntityRoute,
  getId: NonNullable<EntityConfig["getId"]>
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
