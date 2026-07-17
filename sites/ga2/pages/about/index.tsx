import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { AboutView } from "@/views/AboutView/aboutView";
import { GA2_CARDS } from "@/views/AboutView/common/constants";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import type { PageProps } from "../_app";

const Page = (): JSX.Element => {
  return <AboutView cards={GA2_CARDS} />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...GA2_PAGE_META.ABOUT,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
