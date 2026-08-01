import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { RoadmapView } from "@brc/views/RoadmapView/roadmapView";
import { RoadmapView as RoadmapViewGA2 } from "@ga2/views/RoadmapView/roadmapView";
import type { PageProps } from "@pages/_app";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
import { APP_KEYS } from "@site-config/common/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

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
