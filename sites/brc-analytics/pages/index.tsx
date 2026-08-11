import { config } from "@brc/config/config";
import { BRC_PAGE_META } from "@brc/meta/constants";
import { HomeView } from "@brc/views/HomeView/homeView";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { StyledMain } from "@repo/shared/components/layout/Main/main.styles";
import { SMOKE_LIGHTEST } from "@repo/shared/styles/palette";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

const Page = (): JSX.Element | null => {
  const { dimensions } = useLayoutDimensions();

  // Wait for known layout dimensions (e.g., header height) to avoid initial layout shift.
  if (!dimensions.header.height) return null;

  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageDescription: BRC_PAGE_META.HOME.pageDescription,
      pageTitle: config().appTitle,
      themeOptions: {
        palette: { background: { default: SMOKE_LIGHTEST } },
      },
    },
  };
};

export default Page;

Page.Main = StyledMain;
