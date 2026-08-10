import { BRC_PAGE_META } from "@brc/meta/constants";
import { LearnView } from "@brc/views/LearnView/learnView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { PageMeta } from "@repo/shared/meta/types";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<PageMeta> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.LEARN,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
