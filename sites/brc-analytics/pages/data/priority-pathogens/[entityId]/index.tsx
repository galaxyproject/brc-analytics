import type { Outbreak } from "@brc/apis/outbreak";
import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { EntityDetailView } from "@repo/shared/views/EntityView/entityView";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "priority-pathogens";

const Page = (props: EntityPageProps<Outbreak>): JSX.Element => {
  return (
    <EntityDataGate>
      <EntityDetailView {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<Outbreak>(
  config,
  ENTITY_LIST_TYPE,
  BRC_PAGE_META.PRIORITY_PATHOGEN_DETAIL
);

export default Page;
