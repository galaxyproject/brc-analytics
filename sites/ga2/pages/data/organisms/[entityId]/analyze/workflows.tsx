import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { useWorkflowRedirect } from "@repo/shared/views/OrganismWorkflowInputsView/hooks/UseWorkflowRedirect/hook";
import { OrganismWorkflowInputsView } from "@repo/shared/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import type { GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "organisms";

const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  const trsId = useWorkflowRedirect(entityId);

  if (!trsId) return <></>;

  return (
    <EntityDataGate>
      <OrganismWorkflowInputsView entityId={entityId} trsId={trsId} />
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
      ...GA2_PAGE_META.ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
