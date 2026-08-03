import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { HomeView } from "@brc/views/HomeView/homeView";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { HomeView as GA2HomeView } from "@ga2/views/HomeView/homeView";
import { StyledMain } from "@repo/shared/components/layout/Main/main.styles";
import { APP_KEYS } from "@site-config/common/constants";
import { type AppSiteConfig } from "@site-config/common/entities";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

export const Home = (): JSX.Element | null => {
  const { config } = useConfig();
  const { appKey } = config as AppSiteConfig;
  const { dimensions } = useLayoutDimensions();

  // Wait for known layout dimensions (e.g., header height) to avoid initial layout shift.
  if (!dimensions.header.height) return null;

  if (appKey === APP_KEYS.GA2) return <GA2HomeView />;

  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { appKey, appTitle } = config();

  const backgroundColor = appKey === APP_KEYS.GA2 ? "#FAEDDC" : "#FAFBFB";

  return {
    props: {
      pageDescription: getPageMeta(appKey).HOME.pageDescription,
      pageTitle: appTitle,
      themeOptions: {
        palette: { background: { default: backgroundColor } },
      },
    },
  };
};

export default Home;

Home.Main = StyledMain;
