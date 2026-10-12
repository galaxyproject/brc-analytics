import { LOGAN_PAGE_META } from "@logan/meta/constants";
import { SMOKE } from "@logan/theme/options/palette";
import { LoganResultsView } from "@logan/views/LoganResultsView/loganResultsView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <LoganResultsView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription: LOGAN_PAGE_META.RESULTS.pageDescription,
      pageTitle: LOGAN_PAGE_META.RESULTS.pageTitle,
      themeOptions: {
        palette: { background: { default: SMOKE.LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
