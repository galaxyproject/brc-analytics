import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../../../app/common/meta/utils";
import { config } from "../../../app/config/config";
import { WorkflowsView } from "../../../app/views/WorkflowsView/workflowsView";

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: "workflows",
      ...getPageMeta(config().appKey).WORKFLOWS,
    },
  };
};

const Page = (): JSX.Element => {
  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
