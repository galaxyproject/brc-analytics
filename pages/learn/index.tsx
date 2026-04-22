import { GetStaticProps } from "next";
import { JSX } from "react";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { LearnView } from "../../app/views/LearnView/learnView";
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
