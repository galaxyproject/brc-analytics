import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { buildOrganismDetails as buildBRCOrganismDetails } from "@brc/viewModelBuilders/viewModelBuilders";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { OrganismWorkflowInputsView } from "@repo/shared/views/OrganismWorkflowInputsView/organismWorkflowInputsView";
import { APP_KEYS } from "@site-config/common/constants";
import type { GetStaticProps } from "next";
import Router, { useRouter } from "next/router";
import { type JSX, useEffect } from "react";

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
  const { isReady, query } = useRouter();
  // An empty `?trsId=` is treated as missing (redirects to the organism detail).
  const trsId =
    typeof query.trsId === "string" && query.trsId ? query.trsId : undefined;
  const shouldRedirect = isReady && !trsId;

  useEffect(() => {
    if (shouldRedirect) {
      Router.replace(replaceParameters(ROUTES.ORGANISM, { entityId }));
    }
  }, [entityId, shouldRedirect]);

  if (!isReady || !trsId) return <></>;

  // GA2 has no priority pathogens, so it uses the shared organism-details builder
  // (the SideColumn default); the priority-pathogen builder renders the chip.
  const organismBuilder =
    config().appKey === APP_KEYS.GA2 ? undefined : buildBRCOrganismDetails;

  return (
    <EntityDataGate>
      <OrganismWorkflowInputsView
        entityId={entityId}
        organismBuilder={organismBuilder}
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
      ...getPageMeta(config().appKey).ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
