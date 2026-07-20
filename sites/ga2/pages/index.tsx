import { GA2_PAGE_META } from "@/common/meta/ga2/constants";
import { HomeView } from "@/views/HomeView/ga2/homeView";
import { StyledMain } from "@brc-analytics/core/components/Layout/components/Main/main.styles";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { config } from "@site-config/ga2/config";
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
      pageDescription: GA2_PAGE_META.HOME.pageDescription,
      pageTitle: appTitle,
      themeOptions: {
        palette: { background: { default: "#FAEDDC" } },
      },
    },
  };
};

export default Page;

Page.Main = StyledMain;
