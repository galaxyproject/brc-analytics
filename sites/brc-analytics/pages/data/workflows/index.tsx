import { BRC_PAGE_META } from "@brc/meta/constants";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { WorkflowsView } from "@repo/shared/views/WorkflowsView/workflowsView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const ENTITY_LIST_TYPE = "workflows";

const Page = (): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowsView />
    </EntityDataGate>
  );
};

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: ENTITY_LIST_TYPE,
      ...BRC_PAGE_META.WORKFLOWS,
    },
  };
};

export default Page;

Page.Main = DXMain;
