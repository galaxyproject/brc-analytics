import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { WorkflowsView } from "@/views/WorkflowsView/workflowsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";

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
