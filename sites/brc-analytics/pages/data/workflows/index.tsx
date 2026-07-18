import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { WorkflowsView } from "@/views/WorkflowsView/workflowsView";
import { EntityDataGate } from "@brc-analytics/core/components/EntityDataGate/entityDataGate";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";

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
      ...BRC_PAGE_META.WORKFLOWS,
    },
  };
};

export default Page;

Page.Main = DXMain;
