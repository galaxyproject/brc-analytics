import type { PageMeta } from "@repo/shared/meta/types";
import type { GetStaticProps } from "next";
import type { EntitiesPageParams, EntitiesPageProps } from "./types";

/**
 * Builds getStaticProps for the entity-list page: resolves the page metadata
 * for the requested entity type, returning notFound for a type with no entry.
 * @param meta - Page metadata keyed by entity route.
 * @returns getStaticProps.
 */
export function makeEntitiesStaticProps(
  meta: Record<string, PageMeta>
): GetStaticProps<EntitiesPageProps, EntitiesPageParams> {
  return async ({ params }) => {
    if (!params?.entityListType) return { notFound: true };

    const entityMeta = meta[params.entityListType];
    if (!entityMeta) return { notFound: true };

    return {
      props: {
        entityListType: params.entityListType,
        pageDescription: entityMeta.pageDescription,
        pageTitle: entityMeta.pageTitle,
      },
    };
  };
}
