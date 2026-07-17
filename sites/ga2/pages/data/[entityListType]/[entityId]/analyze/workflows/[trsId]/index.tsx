import {
  EntitiesResponse,
  WorkflowCategory,
} from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "@/apis/catalog/ga2/entities";
import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { config } from "@/config/config";
import { getEntities } from "@/utils/entityUtils";
import {
  formatTrsId,
  workflowIsCompatibleWithAssembly,
} from "@/views/AnalyzeWorkflowsView/components/Main/utils";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "@/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { buildOrganismWorkflows } from "@/views/OrganismView/components/Main/utils";
import { OrganismWorkflowInputsView } from "@/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { WorkflowInputsView } from "@/views/WorkflowInputsView/workflowInputsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import type { Organism } from "@brc-analytics/core/views/OrganismView/types";
import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import workflowsData from "catalog/output/workflows.json";
import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";

// Cast the schema-validated catalog JSON to its typed shape.
const workflows = workflowsData as unknown as WorkflowCategory[];

interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
  trsId: string;
}

interface Props {
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
  trsId: string;
}

const Page = (props: Props): JSX.Element => {
  return (
    <EntityDataGate>
      {props.entityListType === "organisms" ? (
        <OrganismWorkflowInputsView
          entityId={props.entityId}
          trsId={props.trsId}
        />
      ) : (
        <WorkflowInputsView {...props} />
      )}
    </EntityDataGate>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  const paths: GetStaticPathsResult<Params>["paths"] = [];

  // Generate paths for assemblies.
  const assemblyConfig = entities.find(({ route }) => route === "assemblies");

  if (assemblyConfig) {
    await seedDatabase("assemblies", assemblyConfig);

    const entitiesResponse =
      await getEntities<GA2AssemblyEntity>(assemblyConfig);

    processAssemblyPaths(assemblyConfig, entitiesResponse, paths);
  }

  // Generate paths for organisms.
  const organismConfig = entities.find(({ route }) => route === "organisms");

  if (organismConfig) {
    await seedDatabase("organisms", organismConfig);

    const entitiesResponse = await getEntities<Organism>(organismConfig);

    processOrganismPaths(organismConfig, entitiesResponse, paths);
  }

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps = async (
  context: GetStaticPropsContext<Params>
): Promise<GetStaticPropsResult<Props>> => {
  const { entityId, entityListType, trsId } = context.params as Params;

  if (!entityListType || !entityId || !trsId) return { notFound: true };
  if (entityListType !== "assemblies" && entityListType !== "organisms")
    return { notFound: true };

  return {
    props: {
      entityId,
      entityListType,
      ...GA2_PAGE_META.CONFIGURE_WORKFLOW,
      trsId,
    },
  };
};

export default Page;

/**
 * Processes the static paths for assembly entities.
 * @param entityConfig - Entity config.
 * @param entitiesResponse - Entities response.
 * @param paths - Static paths.
 */
function processAssemblyPaths(
  entityConfig: EntityConfig,
  entitiesResponse: EntitiesResponse<GA2AssemblyEntity>,
  paths: GetStaticPathsResult<Params>["paths"]
): void {
  const { route: entityListType } = entityConfig;
  const { hits: entities } = entitiesResponse;

  for (const entity of entities) {
    // Get the entity ID.
    const entityId = entityConfig.getId?.(entity);

    if (!entityId) continue;

    // Get the compatible workflows.
    const compatibleWorkflows = workflows
      .flatMap(({ workflows }) => workflows)
      .filter((workflow) => workflowIsCompatibleWithAssembly(workflow, entity));

    // Create differential expression analysis path.
    paths.push({
      params: {
        entityId,
        entityListType,
        trsId: DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId,
      },
    });

    // Create paths for each compatible workflow.
    compatibleWorkflows.forEach((workflow) => {
      // Format the trsId for URL use.
      const trsId = formatTrsId(workflow.trsId);
      paths.push({
        params: {
          entityId,
          entityListType,
          trsId,
        },
      });
    });
  }
}

/**
 * Processes the static paths for organism entities.
 * @param entityConfig - Entity config.
 * @param entitiesResponse - Entities response.
 * @param paths - Static paths.
 */
function processOrganismPaths(
  entityConfig: EntityConfig,
  entitiesResponse: EntitiesResponse<Organism>,
  paths: GetStaticPathsResult<Params>["paths"]
): void {
  const { route: entityListType } = entityConfig;
  const { hits: entities } = entitiesResponse;

  for (const entity of entities) {
    const entityId = entityConfig.getId?.(entity);

    if (!entityId) continue;

    const compatibleCategories = buildOrganismWorkflows(
      entity,
      workflows,
      true
    );
    const compatibleWorkflows = compatibleCategories.flatMap(
      (category) => category.workflows
    );

    compatibleWorkflows.forEach((workflow) => {
      const trsId = formatTrsId(workflow.trsId);
      paths.push({
        params: {
          entityId,
          entityListType,
          trsId,
        },
      });
    });
  }
}
