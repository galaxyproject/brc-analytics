import {
  GetStaticPaths,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { config } from "../../../../../app/config/config";
import { seedDatabase } from "../../../../../app/utils/seedDatabase";
import { getEntities, getEntity } from "../../../../../app/utils/entityUtils";
import {
  BRCDataCatalogGenome,
  BRCDataCatalogOrganism,
  EntitiesResponse,
  Workflow,
} from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import workflows from "../../../../../catalog/output/workflows.json";
import {
  formatTrsId,
  workflowIsCompatibleWithEntity,
} from "../../../../../app/components/Entity/components/AnalysisMethodsCatalog/utils";
import { getEntityConfig } from "@databiosphere/findable-ui/lib/config/utils";
import { WorkflowInputsView } from "../../../../../app/views/WorkflowInputsView/workflowInputsView";
import { Props as WorkflowInputsViewProps } from "../../../../../app/views/WorkflowInputsView/types";
import { WORKFLOW_TARGET_PAGE } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/schema-entities";

interface StaticPath {
  params: PageUrlParams;
}

interface PageUrlParams extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
  trsId: string;
}

interface Props {
  entityId: string;
  entityListType: string;
  genome?: BRCDataCatalogGenome | null;
  workflow: Workflow;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  const paths: StaticPath[] = [];

  // Process both assemblies and organisms
  const assemblyConfig = entities.find(({ route }) => route === "assemblies");
  const organismConfig = entities.find(({ route }) => route === "organisms");

  if (assemblyConfig) {
    await seedDatabase("assemblies", assemblyConfig);
    const entitiesResponse: EntitiesResponse<BRCDataCatalogGenome> =
      await getEntities(assemblyConfig);
    processEntityPaths(assemblyConfig, entitiesResponse, paths);
  }

  if (organismConfig) {
    await seedDatabase("organisms", organismConfig);
    const entitiesResponse: EntitiesResponse<BRCDataCatalogOrganism> =
      await getEntities(organismConfig);
    processEntityPaths(organismConfig, entitiesResponse, paths);
  }

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps = async (
  context: GetStaticPropsContext<PageUrlParams>
): Promise<GetStaticPropsResult<Props>> => {
  const appConfig = config();
  const { entities } = appConfig;
  const { entityId, entityListType, trsId } = context.params as PageUrlParams;

  if (!entityListType || !entityId || !trsId) return { notFound: true };
  if (entityListType !== "assemblies" && entityListType !== "organisms") {
    return { notFound: true };
  }

  const entityConfig = getEntityConfig(entities, entityListType);

  if (!entityConfig) return { notFound: true };

  // Seed database.
  await seedDatabase(entityConfig.route, entityConfig);

  // Get the entity (assembly or organism)
  const entity =
    entityListType === "assemblies"
      ? await getEntity<BRCDataCatalogGenome>(entityConfig, entityId)
      : await getEntity<BRCDataCatalogOrganism>(entityConfig, entityId);

  // For assembly workflow configuration, we need the genome
  // For organisms, we can use the organism entity directly
  const genome =
    entityListType === "assemblies"
      ? (entity as BRCDataCatalogGenome)
      : undefined;

  // Only require genome for assembly pages
  if (entityListType === "assemblies" && !genome) {
    return { notFound: true };
  }

  // Find workflow.
  const workflow = workflows
    .filter((category) => {
      // Filter by category-level targetPages - only include categories that target this page
      if (!category.targetPages) return true; // Include categories without targetPages for backward compatibility
      if (entityListType === "assemblies") {
        return category.targetPages.includes(WORKFLOW_TARGET_PAGE.ASSEMBLIES);
      } else if (entityListType === "organisms") {
        return category.targetPages.includes(WORKFLOW_TARGET_PAGE.ORGANISMS);
      }
      return false;
    })
    .flatMap((category) => category.workflows)
    .filter((workflow) => {
      // Filter by entity compatibility (ploidy and taxonomy)
      return workflowIsCompatibleWithEntity(workflow, entity);
    })
    .find((workflow) => formatTrsId(workflow.trsId) === trsId);

  if (!workflow) return { notFound: true };

  return {
    props: {
      entityId,
      entityListType,
      genome: genome || null, // Explicitly set to null when undefined for proper serialization
      workflow,
    },
  };
};

const ConfigureWorkflowInputs = (
  props: WorkflowInputsViewProps
): JSX.Element => {
  return <WorkflowInputsView {...props} />;
};

export default ConfigureWorkflowInputs;

/**
 * Processes the static paths for the given entity response.
 * @param entityConfig - Entity config.
 * @param entitiesResponse - Entities response.
 * @param paths - Static paths.
 */
function processEntityPaths(
  entityConfig: EntityConfig,
  entitiesResponse: EntitiesResponse<
    BRCDataCatalogGenome | BRCDataCatalogOrganism
  >,
  paths: StaticPath[]
): void {
  const { route: entityListType } = entityConfig;
  const { hits: entities } = entitiesResponse;

  for (const entity of entities) {
    // Get the entity ID.
    const entityId = entityConfig.getId?.(entity);

    if (!entityId) continue;

    // Get the compatible workflows using the generic function.
    const compatibleWorkflows = workflows
      .flatMap(({ workflows }) => workflows)
      .filter((workflow) => workflowIsCompatibleWithEntity(workflow, entity));

    // Create paths for each compatible workflow.
    compatibleWorkflows.forEach((workflow) => {
      // Format the trsId for URL use
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
