import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { config } from "../../../app/config/config";
import { WorkflowsView } from "../../../app/views/WorkflowsView/workflowsView";
import { APP_KEYS } from "../../../site-config/common/constants";

export const getStaticProps: GetStaticProps = () => {
  if (config().appKey === APP_KEYS.GA2) return { notFound: true };

  return { props: { entityListType: "workflows", pageTitle: "Workflows" } };
};

const Page = (): JSX.Element => {
  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
