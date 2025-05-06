import { GetStaticProps } from "next";
import { StyledMain } from "../app/components/Layout/components/Main/main.styles";
import { HomeView } from "../app/views/HomeView/homeView";

export const Home = (): JSX.Element => {
  return <HomeView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "BRC Analytics",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Home;

Home.Main = StyledMain;
