import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../../../app/common/meta/utils";
import { StyledPagesMain } from "../../../app/components/Layout/components/Main/main.styles";
import { config } from "../../../app/config/config";
import { RoadmapView } from "../../../app/views/RoadmapView/roadmapView";
import { RoadmapViewGA2 } from "../../../app/views/RoadmapView/roadmapViewGA2";
import { APP_KEYS } from "../../../site-config/common/constants";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  const { appKey } = config();
  if (appKey === APP_KEYS.GA2) return <RoadmapViewGA2 />;
  return <RoadmapView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  const { appKey } = config();
  return {
    props: {
      ...getPageMeta(appKey).ROADMAP,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
