import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { PageMeta } from "@repo/shared/meta/types";
import { getEntity } from "@repo/shared/services/staticGeneration/entities/utils";
import { seedDatabase } from "@repo/shared/utils/seedDatabase/utils";
import type { GetStaticProps } from "next";
import type { EntityPageParams, EntityPageProps } from "./types";

/**
 * Builds getStaticProps for a single entity type's detail page. The site is
 * decoupled by injecting its config accessor; when the entity's detail config
 * opts into static loading, the entity record is fetched into `data`.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param entityListType - Entity list type (route segment) for the page.
 * @param meta - Page metadata (description and title).
 * @returns getStaticProps.
 */
export function makeEntityStaticProps<R>(
  config: () => Pick<SiteConfig, "entities">,
  entityListType: string,
  meta: PageMeta
): GetStaticProps<EntityPageProps<R>, EntityPageParams> {
  return async ({ params }) => {
    if (!params?.entityId) return { notFound: true };

    const entityConfig = config().entities.find(
      ({ route }) => route === entityListType
    );

    if (!entityConfig) return { notFound: true };

    const props: EntityPageProps<R> = {
      entityId: params.entityId,
      entityListType,
      pageDescription: meta.pageDescription,
      pageTitle: meta.pageTitle,
    };

    if (entityConfig.detail.staticLoad) {
      await seedDatabase(entityListType, entityConfig);
      const data = await getEntity<R>(entityConfig, params.entityId);
      if (data) props.data = data;
    }

    return { props };
  };
}
