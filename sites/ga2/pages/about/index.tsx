import { GA2_PAGE_META } from "@ga2/meta/constants";
import { AboutView } from "@ga2/views/AboutView/aboutView";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import type { PageMeta } from "@repo/shared/meta/types";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element => {
  return <AboutView />;
};

export const getStaticProps: GetStaticProps<
  PageMeta & {
    themeOptions: object;
  }
> = async () => {
  return {
    props: {
      ...GA2_PAGE_META.ABOUT,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledPagesMain;
