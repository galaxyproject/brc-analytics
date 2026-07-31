import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { LearnView } from "@/views/LearnView/learnView";
import type { PageProps } from "@pages/_app";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LearnView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle">
> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.LEARN,
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
