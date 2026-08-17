import type { GA2OrganismEntity } from "@ga2/apis/organism";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { type GA2OrganismDetail } from "@ga2/services/staticGeneration/organism/types";
import { augmentOrganismDetail } from "@ga2/services/staticGeneration/organism/utils";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
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
const Page = (props: EntityPageProps<GA2OrganismDetail>): JSX.Element => {
  return <EntityDetailView {...props} />;
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<
  GA2OrganismEntity,
  GA2OrganismDetail
>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ORGANISM_DETAIL,
  augmentOrganismDetail
);

export default Page;
