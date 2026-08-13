import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { getEntities } from "@repo/shared/services/staticGeneration/entities/utils";
import { seedDatabase } from "@repo/shared/utils/seedDatabase/utils";
import type { GetStaticPaths, GetStaticPathsResult } from "next";
import type { EntityPageParams } from "./types";

/**
 * Builds getStaticPaths for a single entity type's pages — one path per entity.
 * The site is decoupled from the shared code by injecting its config accessor.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param entityListType - Entity list type (route segment) to build paths for.
 * @returns getStaticPaths.
 */
export function makeEntityStaticPaths(
  config: () => Pick<SiteConfig, "entities">,
  entityListType: string
): GetStaticPaths<EntityPageParams> {
  return async () => {
    const paths: GetStaticPathsResult<EntityPageParams>["paths"] = [];

    const entityConfig = config().entities.find(
      ({ route }) => route === entityListType
    );

    if (entityConfig) {
      await seedDatabase(entityListType, entityConfig);

      const { hits } = await getEntities(entityConfig);

      for (const entity of hits) {
        const entityId = entityConfig.getId?.(entity);
        if (entityId) paths.push({ params: { entityId } });
      }
    }

    return { fallback: false, paths };
  };
}
