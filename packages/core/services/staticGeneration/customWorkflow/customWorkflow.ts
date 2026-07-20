import { getEntities } from "@brc-analytics/core/services/staticGeneration/entities/utils";
import { seedDatabase } from "@brc-analytics/core/utils/seedDatabase";
import { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  GetStaticPaths,
  GetStaticPathsResult,
  GetStaticProps,
  GetStaticPropsContext,
} from "next";
import { CustomWorkflowMeta, CustomWorkflowProps, Params } from "./types";

/**
 * Builds the shared getStaticPaths for the custom-workflow page: one path per
 * assembly the site configures.
 * @param config - Site config accessor (provides the site's entity configs).
 * @returns getStaticPaths.
 */
export function makeCustomWorkflowStaticPaths(
  config: () => Pick<SiteConfig, "entities">
): GetStaticPaths<Params> {
  return async () => {
    const paths: GetStaticPathsResult<Params>["paths"] = [];
    for (const entityConfig of config().entities) {
      const { route: entityListType } = entityConfig;
      if (entityListType !== "assemblies") continue;
      await seedDatabase(entityListType, entityConfig);
      const entities = await getEntities(entityConfig);
      for (const entity of entities.hits) {
        const entityId = entityConfig.getId?.(entity);
        if (!entityId) continue;
        paths.push({ params: { entityId, entityListType } });
      }
    }
    return { fallback: false, paths };
  };
}

/**
 * Builds the shared getStaticProps for the custom-workflow page: attaches the
 * site's page metadata and the custom workflow's TRS ID. Both are supplied by
 * the site so the factory stays free of site/view dependencies.
 * @param trsId - Custom workflow TRS ID.
 * @param meta - Custom-workflow page metadata.
 * @returns getStaticProps.
 */
export function makeCustomWorkflowStaticProps(
  trsId: string,
  meta: CustomWorkflowMeta
): GetStaticProps<CustomWorkflowProps> {
  return async ({ params }: GetStaticPropsContext) => {
    const { entityId } = params as Params;
    if (!entityId) return { notFound: true };
    // trsId loads the correct workflow in WorkflowInputsView on arrival.
    return { props: { entityId, ...meta, trsId } };
  };
}
