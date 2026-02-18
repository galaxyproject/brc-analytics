import { JSX } from "react";
import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { WorkflowsView } from "app/views/WorkflowsView/workflowsView";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import Error from "next/error";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = () => {
  return { props: { entityListType: "workflows", pageTitle: "Workflows" } };
};

const Page = (): JSX.Element => {
  const isWorkflowsEnabled = useFeatureFlag("workflows");

  // Throw an error if the workflows feature is not enabled.
  if (!isWorkflowsEnabled) return <Error statusCode={404} />;

  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
