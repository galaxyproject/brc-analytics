import { type GA2AssemblyEntity } from "@ga2/apis/assembly";
import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import { makeEntityStaticProps } from "@repo/shared/services/staticGeneration/entity/staticProps";
import type { EntityPageProps } from "@repo/shared/services/staticGeneration/entity/types";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

/**
 * Custom workflow configure page for an assembly. The assembly record arrives
 * via props; only the workflows list is loaded.
 * @param props - Page props.
 * @param props.data - Assembly.
 * @param props.entityId - Assembly entity ID.
 * @returns Custom workflow configure page.
 */
const Page = ({
  data,
  entityId,
}: EntityPageProps<GA2AssemblyEntity>): JSX.Element => {
  if (!data) return <></>;

  return (
    <EntityDataGate routes={["workflows"]}>
      <WorkflowInputsView
        assembly={data}
        entityId={entityId}
        trsId={CUSTOM_WORKFLOW.trsId}
      />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps = makeEntityStaticProps<GA2AssemblyEntity>(
  config,
  ENTITY_LIST_TYPE,
  GA2_PAGE_META.CUSTOM_WORKFLOW
);

export default Page;
