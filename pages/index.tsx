import { GetStaticProps } from "next";
import { StyledMain } from "../app/components/Layout/components/Main/main.styles";
import { HomeView } from "../app/views/HomeView/homeView";
import { config } from "../app/config/config";
import { ROUTES } from "../routes/constants";

export const Home = (): JSX.Element => {
  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths, appTitle } = config();

  if (allowedPaths && !allowedPaths.includes("/")) {
    return {
      redirect: {
        destination: ROUTES.ORGANISMS,
        permanent: false,
      },
    };
  }

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
