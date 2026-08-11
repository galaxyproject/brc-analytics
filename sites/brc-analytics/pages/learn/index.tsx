import { BRC_PAGE_META } from "@brc/meta/constants";
import { LearnView } from "@brc/views/LearnView/learnView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { ThemedPageProps } from "@repo/shared/meta/types";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<ThemedPageProps> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.LEARN,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
