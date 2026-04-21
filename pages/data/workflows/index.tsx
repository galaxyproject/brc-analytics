import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { BRC_PAGE_META } from "../../../app/common/meta/brc/constants";
import { JSX } from "react";
import { WorkflowsView } from "../../../app/views/WorkflowsView/workflowsView";

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: "workflows",
      ...BRC_PAGE_META.WORKFLOWS,
    },
  };
};

const Page = (): JSX.Element => {
  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
