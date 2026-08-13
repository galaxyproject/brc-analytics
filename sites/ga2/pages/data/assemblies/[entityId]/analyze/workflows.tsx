import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { Side as GA2Side } from "@ga2/views/EntityView/assembly/components/Side/ga2/side";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type {
  EntityPageParams,
  EntityPageProps,
} from "@repo/shared/services/staticGeneration/entity/types";
import { AnalyzeWorkflowsView } from "@repo/shared/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { getTrsId } from "@repo/shared/workflow/utils";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

const Page = ({ entityId }: EntityPageProps<never>): JSX.Element => {
  const { isReady, query } = useRouter();
  const trsId = getTrsId(query);

  if (!isReady) return <></>;

  return (
    <EntityDataGate>
      {trsId ? (
        <WorkflowGate
          fallback={
            <WorkflowNotFound
              entityContext="assembly"
              href={replaceParameters(ROUTES.ANALYZE_WORKFLOWS, { entityId })}
            />
          }
          trsId={trsId}
        >
          <WorkflowInputsView entityId={entityId} trsId={trsId} />
        </WorkflowGate>
      ) : (
        <AnalyzeWorkflowsView SideComponent={GA2Side} entityId={entityId} />
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
      ...GA2_PAGE_META.ANALYZE_WORKFLOWS,
    },
  };
};

export default Page;
