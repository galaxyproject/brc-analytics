import { API } from "./routes";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntitiesById, setEntitiesById, setEntitiesByType } from "./store";
import { EntityRoute } from "./types";
import {
  Workflow,
  WorkflowCategory,
} from "../../apis/catalog/brc-analytics-catalog/common/entities";
import { formatTrsId } from "../../components/Entity/components/AnalysisMethodsCatalog/utils";
import { CUSTOM_WORKFLOW } from "../../components/Entity/components/AnalysisMethod/components/CustomWorkflow/constants";
import { DIFFERENTIAL_EXPRESSION_WORKFLOW } from "../../components/Entity/components/AnalysisMethod/components/DifferentialExpressionWorkflow/constants";

/**
 * Fetches entities from the API.
 * @param url - URL.
 * @returns Entity list.
 */
async function fetchEntities(url: string): Promise<unknown[]> {
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
  return route in API;
}

/**
 * Loads the entities store with entities from the API.
 * @param config - Site config.
 */
export async function loadEntities(config: SiteConfig): Promise<void> {
  for (const entity of config.entities) {
    const { getId, route } = entity;

    if (!isEntityRoute(route)) continue;

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
 * Loads the workflows store with workflows from the API.
 */
export async function loadWorkflows(): Promise<void> {
  if (getEntitiesById().has("workflows")) return;

  const workflowCategories = (await fetchEntities(
    API.workflows
  )) as WorkflowCategory[];

  const workflows = workflowCategories.flatMap((w) => w.workflows);

  const workflowById = new Map<string, Workflow>();

  for (const workflow of workflows) {
    workflowById.set(formatTrsId(workflow.trsId), workflow);
  }

  // Add custom workflow.
  workflowById.set(CUSTOM_WORKFLOW.trsId, CUSTOM_WORKFLOW);

  // Add differential expression workflow.
  workflowById.set(
    DIFFERENTIAL_EXPRESSION_WORKFLOW.trsId,
    DIFFERENTIAL_EXPRESSION_WORKFLOW
  );

  setEntitiesById("workflows", workflowById);
  setEntitiesByType("workflows", workflowCategories);
}
