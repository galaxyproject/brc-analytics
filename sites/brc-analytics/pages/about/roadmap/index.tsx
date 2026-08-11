import { BRC_PAGE_META } from "@brc/meta/constants";
import { RoadmapView } from "@brc/views/RoadmapView/roadmapView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { ThemedPageProps } from "@repo/shared/meta/types";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <RoadmapView />;
};

export const getStaticProps: GetStaticProps<ThemedPageProps> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.ROADMAP,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
