import { smokeLightest } from "@databiosphere/findable-ui/lib/theme/common/palette";
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
        components: {
          MuiLink: {
            styleOverrides: {
              root: {
                color: "#28285b",
                textDecoration: "underline",
                // eslint-disable-next-line sort-keys -- disabling key order for readability
                "&:hover": { textDecoration: "none" },
              },
            },
          },
        },
        palette: { background: { default: smokeLightest } },
      },
    },
  };
};

export default Home;

Home.Main = StyledMain;
