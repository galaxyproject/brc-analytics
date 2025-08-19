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
  genome: BRCDataCatalogGenome;
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
  if (entityListType !== "assemblies") return { notFound: true };

  const entityConfig = getEntityConfig(entities, entityListType);

  if (!entityConfig) return { notFound: true };

  // Seed database.
  await seedDatabase(entityConfig.route, entityConfig);

  // For now, only support assemblies in the workflow configuration page
  // Organisms will need separate workflow configuration components
  if (entityListType !== "assemblies") {
    return { notFound: true };
  }

  const genome = await getEntity<BRCDataCatalogGenome>(entityConfig, entityId);

  // Find workflow.
  const workflow = workflows
    .flatMap((w) => w.workflows)
    .find((workflow) => formatTrsId(workflow.trsId) === trsId);

  if (!workflow) return { notFound: true };

  return {
    props: {
      entityId,
      genome,
      workflow,
    },
  };
};

const ConfigureWorkflowInputs = (props: Props): JSX.Element => {
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
