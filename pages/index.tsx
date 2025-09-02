import { GetStaticProps } from "next";
import { StyledMain } from "../app/components/Layout/components/Main/main.styles";
import { HomeView } from "../app/views/HomeView/homeView";
import { config } from "../app/config/config";

export const Home = (): JSX.Element => {
  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { appTitle } = config();

  return {
    props: {
      pageTitle: appTitle,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Home;

Home.Main = StyledMain;
