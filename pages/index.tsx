import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../app/common/meta/utils";
import { StyledMain } from "../app/components/Layout/components/Main/main.styles";
import { config } from "../app/config/config";
import { HomeView as GA2HomeView } from "../app/views/HomeView/ga2/homeView";
import { HomeView } from "../app/views/HomeView/homeView";
import { APP_KEYS } from "../site-config/common/constants";
import { AppSiteConfig } from "../site-config/common/entities";

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
