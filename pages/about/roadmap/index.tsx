import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { RoadmapView as RoadmapViewGA2 } from "@/views/RoadmapView/ga2/roadmapView";
import { RoadmapView } from "@/views/RoadmapView/roadmapView";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { APP_KEYS } from "@site-config/common/constants";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { ROUTES } from "../../../routes/constants";
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
  const { allowedPaths, appKey } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT_ROADMAP)) {
    return { notFound: true };
  }

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
