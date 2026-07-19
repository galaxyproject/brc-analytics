import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { LearnView } from "@/views/LearnView/learnView";
import { GetStaticProps } from "next";
import { JSX } from "react";
import type { PageProps } from "../_app";

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
