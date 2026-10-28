import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { type GA2AssemblyEntity } from "@ga2/apis/assembly";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { Side as GA2Side } from "@ga2/views/EntityView/assembly/components/Side/ga2/side";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { getAssemblyWorkflowAvailability } from "@repo/shared/components/workflow/WorkflowGate/utils";
import { WorkflowGate } from "@repo/shared/components/workflow/WorkflowGate/workflowGate";
import { WorkflowNotFound } from "@repo/shared/components/workflow/WorkflowNotFound/workflowNotFound";
import { ROUTES } from "@repo/shared/routes/constants";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { AnalyzeWorkflowsView } from "@repo/shared/views/AnalyzeWorkflowsView/analyzeWorkflowsView";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { getTrsId } from "@repo/shared/workflow/utils";
import { useRouter } from "next/router";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

/**
 * Assembly analyze workflows page. Renders the compatible-workflows list, or —
 * when a workflow is selected via the `trsId` query param — the configure inputs
 * view for that workflow. The assembly record arrives via props; only the
 * workflows list is loaded.
 * @param props - Page props.
 * @param props.data - Assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns Assembly analyze workflows page.
 */
const Page = ({
  data,
  entityId,
}: EntityPageProps<GA2AssemblyEntity>): JSX.Element => {
  const { isReady, query } = useRouter();
  const trsId = getTrsId(query);

  if (!data || !isReady) return <></>;

  return (
    <EntityDataGate routes={["workflows"]}>
      {trsId ? (
        <WorkflowGate
          fallback={
            <WorkflowNotFound
              entityContext="assembly"
              href={replaceParameters(ROUTES.ANALYZE_WORKFLOWS, { entityId })}
            />
          }
          isWorkflowAvailable={getAssemblyWorkflowAvailability(data)}
          trsId={trsId}
        >
          <WorkflowInputsView
            assembly={data}
            entityId={entityId}
            trsId={trsId}
          />
        </WorkflowGate>
      ) : (
        <AnalyzeWorkflowsView
          SideComponent={GA2Side}
          assembly={data}
          entityId={entityId}
        />
      )}
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<GA2AssemblyEntity>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.ANALYZE_WORKFLOWS
);

export default Page;
