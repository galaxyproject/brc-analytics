import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { WorkflowsView } from "@/views/WorkflowsView/workflowsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: "workflows",
      ...GA2_PAGE_META.WORKFLOWS,
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
