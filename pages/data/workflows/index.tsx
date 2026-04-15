import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { WorkflowsView } from "../../../app/views/WorkflowsView/workflowsView";

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {
      entityListType: "workflows",
      pageDescription:
        "Explore Galaxy workflows available for genomic analysis on BRC Analytics.",
      pageTitle: "Workflows",
    },
  };
};

const Page = (): JSX.Element => {
  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
