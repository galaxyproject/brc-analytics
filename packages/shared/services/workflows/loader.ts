import { type SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";
import { type EntitiesLoader } from "./hooks/UseEntities/types";
import { API } from "./routes";
import { getEntitiesById, setEntitiesById, setEntitiesByType } from "./store";
import type { EntityRoute } from "./types";

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
 * Loads the entities store with entities from the API. Skips workflows, which
 * `loadWorkflows` loads.
 * @param config - Site config.
 */
export async function loadEntities(config: SiteConfig): Promise<void> {
  for (const entity of config.entities) {
    const { getId, route } = entity;

    if (!isEntityRoute(route)) continue;

    // Workflows are loaded by loadWorkflows: their API payload is workflow
    // categories, not entities keyed by getId.
    if (route === "workflows") continue;

    const apiRoute = API[route];

    // Entities are already loaded; skip.
    if (getEntitiesById().has(route)) continue;

    // Get id function is not configured; entities are excluded from preloading.
    if (!getId) continue;

    // Fetch the entities.
    const entities = await fetchEntities(apiRoute);

    const entityById = new Map<string, unknown>();
    for (const entity of entities) entityById.set(getId(entity), entity);

    setEntitiesById(route, entityById);
    setEntitiesByType(route, entities);
  }
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
