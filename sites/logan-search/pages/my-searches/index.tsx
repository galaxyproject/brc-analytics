import { LOGAN_PAGE_META } from "@logan/meta/constants";
import { SMOKE } from "@logan/theme/options/palette";
import { MySearchesView } from "@logan/views/MySearchesView/mySearchesView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <MySearchesView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription: LOGAN_PAGE_META.MY_SEARCHES.pageDescription,
      pageTitle: LOGAN_PAGE_META.MY_SEARCHES.pageTitle,
      themeOptions: {
        palette: { background: { default: SMOKE.LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
