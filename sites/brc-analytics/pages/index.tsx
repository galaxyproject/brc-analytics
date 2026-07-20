import { BRC_PAGE_META } from "@/common/meta/brc/constants";
import { config } from "@/config/config";
import { HomeView } from "@/views/HomeView/homeView";
import { StyledMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { GetStaticProps } from "next";
import { JSX } from "react";

const Page = (): JSX.Element | null => {
  const { dimensions } = useLayoutDimensions();

  // Wait for known layout dimensions (e.g., header height) to avoid initial layout shift.
  if (!dimensions.header.height) return null;

  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { appTitle } = config();

  return {
    props: {
      pageDescription: BRC_PAGE_META.HOME.pageDescription,
      pageTitle: appTitle,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } },
      },
    },
  };
};

export default Page;

Page.Main = StyledMain;
