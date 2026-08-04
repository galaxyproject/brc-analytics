import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { EntityDataGate } from "@repo/shared/components/EntityDataGate/entityDataGate";
import { WorkflowsView } from "@repo/shared/views/WorkflowsView/workflowsView";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: "workflows",
      ...getPageMeta(config().appKey).WORKFLOWS,
    },
  };
};

const Page = (): JSX.Element => {
  return (
    <EntityDataGate>
      <WorkflowsView />
    </EntityDataGate>
  );
};

Page.Main = DXMain;

export default Page;
