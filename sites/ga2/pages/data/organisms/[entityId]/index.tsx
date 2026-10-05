import type { GA2OrganismEntity } from "@ga2/apis/organism";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { type WithWorkflowCategories } from "@repo/shared/services/staticGeneration/workflows/types";
import { makeWorkflowCategoriesAugmenter } from "@repo/shared/services/staticGeneration/workflows/utils";
import { EntityDetailView } from "@repo/shared/views/EntityView/entityView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

/**
 * Organism detail page. Prerendered in full: the entity record plus its
 * build-computed workflow categories arrive via props, so no entity-store
 * gate is needed.
 * @param props - Page props.
 * @returns Organism detail page.
 */
const Page = (
  props: EntityPageProps<WithWorkflowCategories<GA2OrganismEntity>>
): JSX.Element => {
  return <EntityDetailView {...props} />;
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<
  GA2OrganismEntity,
  WithWorkflowCategories<GA2OrganismEntity>
>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ORGANISM_DETAIL,
  makeWorkflowCategoriesAugmenter(config)
);

export default Page;
