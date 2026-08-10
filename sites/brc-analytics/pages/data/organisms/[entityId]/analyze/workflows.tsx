import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { buildOrganismDetails as buildBRCOrganismDetails } from "@brc/viewModelBuilders/viewModelBuilders";
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

/**
 * Organism analyze workflows page. A workflow is always selected via the `trsId`
 * query param; a bare URL (no `trsId`) redirects to the organism detail page,
 * where organism workflows are listed.
 * @param props - Page props.
 * @param props.entityId - Organism entity ID.
 * @returns Organism analyze workflows page.
 */
const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  const trsId = useWorkflowRedirect(entityId);

  if (!trsId) return <></>;

  return (
    <EntityDataGate>
      <OrganismWorkflowInputsView
        entityId={entityId}
        organismBuilder={buildBRCOrganismDetails}
        trsId={trsId}
      />
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
      ...BRC_PAGE_META.ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
