import { WorkflowsView } from "@/views/WorkflowsView/workflowsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { GA2_PAGE_META } from "~/meta/constants";

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
      entityListType: "workflows",
      ...GA2_PAGE_META.WORKFLOWS,
    },
  };
};

export default Page;

Page.Main = DXMain;
