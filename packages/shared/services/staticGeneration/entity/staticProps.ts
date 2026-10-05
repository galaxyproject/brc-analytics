import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { seedDatabase } from "@databiosphere/findable-ui/lib/utils/seedDatabase";
import type { PageMeta } from "@repo/shared/meta/types";
import { getEntity } from "@repo/shared/services/staticGeneration/entities/utils";
import type { GetStaticProps } from "next";
import type { EntityPageParams, EntityPageProps } from "./types";

/**
 * Builds getStaticProps for a single entity type's detail page. The site is
 * decoupled by injecting its config accessor; when the entity's detail config
 * opts into static loading, the entity record is fetched into `data` and, where
 * an augmenter is supplied, given the build-computed fields the page renders
 * (e.g. a pre-filtered workflows slice) so it can prerender fully.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param entityListType - Entity list type (route segment) for the page.
 * @param meta - Page metadata (description and title).
 * @param augmentData - Optional build-time augmenter applied to the record.
 * @returns getStaticProps.
 */
export function makeEntityStaticProps<R, D extends R = R>(
  config: () => Pick<SiteConfig, "entities">,
  entityListType: string,
  meta: PageMeta,
  augmentData?: (data: R) => Promise<D>
): GetStaticProps<EntityPageProps<D>, EntityPageParams> {
  return async ({ params }) => {
    if (!params?.entityId) return { notFound: true };

    const entityConfig = config().entities.find(
      ({ route }) => route === entityListType
    );

    if (!entityConfig) return { notFound: true };

    const props: EntityPageProps<D> = {
      entityId: params.entityId,
      entityListType,
      pageDescription: meta.pageDescription,
      pageTitle: meta.pageTitle,
    };

    if (entityConfig.detail.staticLoad) {
      await seedDatabase(entityListType, entityConfig);
      const data = await getEntity<R>(entityConfig, params.entityId);
      if (data)
        props.data = augmentData ? await augmentData(data) : (data as D);
    }

    return { props };
  };
}
