import { Main as DXMain } from "@databiosphere/findable-ui/lib/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { BRC_PAGE_META } from "../../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../../app/common/meta/ga2/constants";
import { JSX } from "react";
import { config } from "../../../app/config/config";
import { APP_KEYS } from "../../../site-config/common/constants";
import { WorkflowsView } from "../../../app/views/WorkflowsView/workflowsView";

export const getStaticProps: GetStaticProps = () => {
  const { appKey } = config();
  const meta =
    appKey === APP_KEYS.GA2 ? GA2_PAGE_META.WORKFLOWS : BRC_PAGE_META.WORKFLOWS;
  return {
    props: {
      entityListType: "workflows",
      ...meta,
    },
  };
};

const Page = (): JSX.Element => {
  return <WorkflowsView />;
};

Page.Main = DXMain;

export default Page;
