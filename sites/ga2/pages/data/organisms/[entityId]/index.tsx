import type { GA2OrganismEntity } from "@ga2/apis/organism";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { EntityDetailView } from "@repo/shared/views/EntityView/entityView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

const Page = (props: EntityPageProps<GA2OrganismEntity>): JSX.Element => {
  return (
    <EntityDataGate>
      <EntityDetailView {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<GA2OrganismEntity>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ORGANISM_DETAIL
);

export default Page;
