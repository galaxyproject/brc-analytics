import { GA2_PAGE_META } from "@ga2/meta/constants";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { WorkflowsView } from "@repo/shared/views/WorkflowsView/workflowsView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "workflows";

const Page = (): JSX.Element => {
  return (
    <EntityDataGate routes={["organisms", ENTITY_LIST_TYPE]}>
      <WorkflowsView />
    </EntityDataGate>
  );
};

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: ENTITY_LIST_TYPE,
      ...GA2_PAGE_META.WORKFLOWS,
    },
  };
};

export default Page;
