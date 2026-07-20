import { RoadmapView } from "@/views/RoadmapView/ga2/roadmapView";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { GA2_PAGE_META } from "~/meta/constants";
import type { PageProps } from "../../_app";

const Page = (): JSX.Element => {
  return <RoadmapView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...GA2_PAGE_META.ROADMAP,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
