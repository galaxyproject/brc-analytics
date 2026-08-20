import type { BRCDataCatalogOrganism } from "@brc/apis/organism";
import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { type BRCOrganismDetail } from "@brc/services/staticGeneration/organism/types";
import { augmentOrganismDetail } from "@brc/services/staticGeneration/organism/utils";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { EntityDetailView } from "@repo/shared/views/EntityView/entityView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

/**
 * Organism detail page. Prerendered in full: the entity record plus its
 * build-computed workflow categories and pangenome arrive via props, so no
 * entity-store gate is needed.
 * @param props - Page props.
 * @returns Organism detail page.
 */
const Page = (props: EntityPageProps<BRCOrganismDetail>): JSX.Element => {
  return <EntityDetailView {...props} />;
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<
  BRCDataCatalogOrganism,
  BRCOrganismDetail
>(
  config,
  ENTITY_LIST_TYPE,
  BRC_PAGE_META.ORGANISM_DETAIL,
  augmentOrganismDetail
);

export default Page;
