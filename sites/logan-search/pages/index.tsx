import { LOGAN_PAGE_META } from "@logan/meta/constants";
import { LoganSearchSiteView } from "@logan/views/LoganSearchSiteView/loganSearchSiteView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LoganSearchSiteView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      // No pageTitle: the tab reads just the app title, not "Logan Search -
      // Logan Search".
      pageDescription: LOGAN_PAGE_META.SEARCH.pageDescription,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
