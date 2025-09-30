import { GetStaticProps } from "next";
import { StyledMain } from "../app/components/Layout/components/Main/main.styles";
import { HomeView } from "../app/views/HomeView/homeView";
import { HomeView as GA2HomeView } from "../app/views/HomeView/ga2/homeView";
import { config } from "../app/config/config";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { AppSiteConfig } from "../site-config/common/entities";
import { APP_KEYS } from "../site-config/common/constants";

export const Home = (): JSX.Element => {
  const { config } = useConfig();
  const { appKey } = config as AppSiteConfig;

  if (appKey === APP_KEYS.GA2) return <GA2HomeView />;

  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { appKey, appTitle } = config();

  const backgroundColor = appKey === APP_KEYS.GA2 ? "#FAEDDC" : "#FAFBFB";

  return {
    props: {
      pageTitle: appTitle,
      themeOptions: {
        palette: { background: { default: backgroundColor } },
      },
    },
  };
};

export default Home;

Home.Main = StyledMain;
