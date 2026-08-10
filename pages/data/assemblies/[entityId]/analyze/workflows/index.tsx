import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { buildOrganismDetails as buildBRCOrganismDetails } from "@brc/viewModelBuilders/viewModelBuilders";
import { Side as BRCSide } from "@brc/views/EntityView/assembly/components/Side/brc/side";
import { Side as GA2Side } from "@ga2/views/EntityView/assembly/components/Side/ga2/side";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { AnalyzeWorkflowsView } from "@repo/shared/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { getTrsId } from "@repo/shared/workflow/utils";
import { APP_KEYS } from "@site-config/common/constants";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

/**
 * Assembly analyze workflows page. Renders the compatible-workflows list, or —
 * when a workflow is selected via the `trsId` query param — the configure inputs
 * view for that workflow.
 * @param props - Page props.
 * @param props.entityId - Assembly entity ID.
 * @returns Assembly analyze workflows page.
 */
const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  const { isReady, query } = useRouter();
  const trsId = getTrsId(query);

  if (!isReady) return <></>;

  const isGA2 = config().appKey === APP_KEYS.GA2;

  // The Side is passed per-site so each branch keeps its concrete component type.
  const workflowsList = isGA2 ? (
    <AnalyzeWorkflowsView SideComponent={GA2Side} entityId={entityId} />
  ) : (
    <AnalyzeWorkflowsView SideComponent={BRCSide} entityId={entityId} />
  );

  // GA2 has no priority pathogens, so it uses the shared organism-details builder
  // (the SideColumn default); the priority-pathogen builder renders the chip.
  const organismBuilder = isGA2 ? undefined : buildBRCOrganismDetails;

  return (
    <EntityDataGate>
      {trsId ? (
        <WorkflowInputsView
          entityId={entityId}
          organismBuilder={organismBuilder}
          trsId={trsId}
        />
      ) : (
        workflowsList
      )}
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
