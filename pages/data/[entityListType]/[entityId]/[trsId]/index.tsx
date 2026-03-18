import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  GetStaticPaths,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { JSX } from "react";
import {
  BRCDataCatalogGenome,
  EntitiesResponse,
} from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";
import { config } from "../../../../../app/config/config";
import { getEntities } from "../../../../../app/utils/entityUtils";
import { seedDatabase } from "../../../../../app/utils/seedDatabase";
import {
  formatTrsId,
  workflowIsCompatibleWithAssembly,
} from "../../../../../app/views/AnalyzeWorkflowsView/components/Main/utils";
import { CUSTOM_WORKFLOW } from "../../../../../app/views/AnalyzeWorkflowsView/custom/constants";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../../../../app/views/AnalyzeWorkflowsView/differentialExpressionAnalysis/constants";
import { WorkflowInputsView } from "../../../../../app/views/WorkflowInputsView/workflowInputsView";
import workflows from "../../../../../catalog/output/workflows.json";

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
  trsId: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const appConfig = config();
  const { entities } = appConfig;

  const paths: StaticPath[] = [];

  const entityConfig = entities.find(({ route }) => route === "assemblies");

  if (entityConfig) {
    await seedDatabase("assemblies", entityConfig);
    const entitiesResponse: EntitiesResponse<
      BRCDataCatalogGenome | GA2AssemblyEntity
    > = await getEntities(entityConfig);
    processEntityPaths(entityConfig, entitiesResponse, paths);
  }

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps = async (
  context: GetStaticPropsContext<PageUrlParams>
): Promise<GetStaticPropsResult<Props>> => {
  const { entityId, entityListType, trsId } = context.params as PageUrlParams;

  if (!entityListType || !entityId || !trsId) return { notFound: true };
  if (entityListType !== "assemblies") return { notFound: true };

  return { props: { entityId, entityListType, trsId } };
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
  entitiesResponse: EntitiesResponse<BRCDataCatalogGenome | GA2AssemblyEntity>,
  paths: StaticPath[]
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

    // Create custom-workflow path.
    paths.push({
      params: {
        entityId,
        entityListType,
        trsId: CUSTOM_WORKFLOW.trsId,
      },
    });

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
