import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { AboutView } from "@/views/AboutView/aboutView";
import { BRC_CARDS } from "@/views/AboutView/common/constants";
import { StyledPagesMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { GetStaticProps } from "next";
import { JSX } from "react";
import type { PageProps } from "../_app";

const Page = (): JSX.Element => {
  return <AboutView cards={BRC_CARDS} />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...BRC_PAGE_META.ABOUT,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
