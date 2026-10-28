import { GA2_PAGE_META } from "@ga2/meta/constants";
import { HomeView } from "@ga2/views/HomeView/homeView";
import { StyledMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription: GA2_PAGE_META.HOME.pageDescription,
      pageTitle: GA2_PAGE_META.HOME.pageTitle,
      themeOptions: {
        palette: { background: { default: "#FAEDDC" } },
      },
    },
  };
};

export default Page;

Page.Main = StyledMain;
