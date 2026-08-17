import type { SiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import type { PageMeta } from "@repo/shared/meta/types";
import { getEntity } from "@repo/shared/services/staticGeneration/entities/utils";
import { seedDatabase } from "@repo/shared/utils/seedDatabase/utils";
import type { GetStaticProps } from "next";
import type { EntityPageParams, EntityPageProps } from "./types";

/**
 * Builds getStaticProps for a single entity type's detail page, serving the
 * entity record as-is.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param entityListType - Entity list type (route segment) for the page.
 * @param meta - Page metadata (description and title).
 * @returns getStaticProps.
 */
export function makeEntityStaticProps<R>(
  config: () => Pick<SiteConfig, "entities">,
  entityListType: string,
  meta: PageMeta
): GetStaticProps<EntityPageProps<R>, EntityPageParams>;
/**
 * Builds getStaticProps for a single entity type's detail page, attaching
 * build-computed fields to the record via the augmenter (e.g. a pre-filtered
 * workflows slice) so the page can prerender fully. The overloads ensure an
 * augmented data type can only be claimed when the augmenter that produces it
 * is actually supplied.
 * @param config - Site config accessor (provides the site's entity configs).
 * @param entityListType - Entity list type (route segment) for the page.
 * @param meta - Page metadata (description and title).
 * @param augmentData - Build-time augmenter applied to the record.
 * @returns getStaticProps.
 */
export function makeEntityStaticProps<R, D extends R>(
  config: () => Pick<SiteConfig, "entities">,
  entityListType: string,
  meta: PageMeta,
  augmentData: (data: R) => Promise<D>
): GetStaticProps<EntityPageProps<D>, EntityPageParams>;
/**
 * Implementation. The site is decoupled by injecting its config accessor;
 * when the entity's detail config opts into static loading, the entity record
 * is fetched into `data` and augmented when an augmenter is supplied.
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
