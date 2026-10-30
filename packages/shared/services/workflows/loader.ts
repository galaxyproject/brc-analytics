import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { Workflow, WorkflowCategory } from "@repo/shared/apis/workflow";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { UNCATALOGED_WORKFLOWS } from "@repo/shared/workflow/listedWorkflows";
import { indexWorkflowsById } from "@repo/shared/workflow/utils";
import { API } from "./routes";
import { getEntitiesById, setEntitiesById, setEntitiesByType } from "./store";
import type { EntityRoute } from "./types";

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
 * Loads one entity list into the store, keyed by id and as a list. Workflows
 * are loaded with the custom and uncataloged workflows added; any other list
 * is keyed by its entity config's getId. A list already in the store isn't
 * fetched again.
 * @param route - Entity list.
 * @param config - Site config.
 * @throws If the site has no entity config with a getId for the list, or the fetch fails.
 */
export async function loadEntityList(
  route: EntityRoute,
  config: Pick<SiteConfig, "entities">
): Promise<void> {
  if (getEntitiesById().has(route)) return;

  if (route === "workflows") {
    await loadWorkflows([CUSTOM_WORKFLOW, ...UNCATALOGED_WORKFLOWS]);
    return;
  }

  const getId = config.entities.find(
    (entityConfig) => entityConfig.route === route
  )?.getId;
  if (!getId) throw new Error(`The ${route} list is not configured.`);

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
  const workflowCategories = (await fetchEntities(
    API.workflows
  )) as WorkflowCategory[];

  setEntitiesById(
    "workflows",
    indexWorkflowsById(workflowCategories, extraWorkflows)
  );
  setEntitiesByType("workflows", workflowCategories);
}
