import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { Side as BRCSide } from "@brc/views/EntityView/assembly/components/Side/brc/side";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { AssemblyView } from "@repo/shared/views/AssemblyView/assemblyView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  return (
    <EntityDataGate>
      <AssemblyView SideComponent={BRCSide} entityId={entityId} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps: GetStaticProps<
  EntityPageProps<never>,
  EntityPageParams
> = async ({ params }) => {
  if (!params?.entityId) return { notFound: true };

  return {
    props: {
      entityId: params.entityId,
      entityListType: ENTITY_LIST_TYPE,
      ...BRC_PAGE_META.ASSEMBLY_DETAIL,
    },
  };
};

export default Page;
