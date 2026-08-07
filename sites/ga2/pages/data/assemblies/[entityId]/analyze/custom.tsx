import { config } from "@ga2/config/config";
import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import type { PageMeta } from "@repo/shared/meta/types";
import { makeEntityStaticPaths } from "@repo/shared/services/staticGeneration/entity/staticPaths";
import type { EntityPageParams } from "@repo/shared/services/staticGeneration/entity/types";
import { WorkflowInputsView } from "@repo/shared/views/WorkflowInputsView/workflowInputsView";
import { CUSTOM_WORKFLOW } from "@repo/shared/workflow/custom";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "assemblies";

interface Props extends Partial<PageMeta> {
  entityId: string;
  trsId: string;
}

const Page = (props: Props): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowInputsView {...props} />
    </EntityDataGate>
  );
};

export const getStaticPaths = makeEntityStaticPaths(config, ENTITY_LIST_TYPE);

export const getStaticProps: GetStaticProps<Props, EntityPageParams> = async ({
  params,
}) => {
  if (!params?.entityId) return { notFound: true };

  return {
    props: {
      entityId: params.entityId,
      ...GA2_PAGE_META.CUSTOM_WORKFLOW,
      trsId: CUSTOM_WORKFLOW.trsId,
    },
  };
};

export default Page;
