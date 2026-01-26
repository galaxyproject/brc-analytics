import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AboutView } from "../../app/views/AboutView/aboutView";
import { AboutViewGA2 } from "../../app/views/AboutView/aboutViewGA2";
import { APP_KEYS } from "../../site-config/common/constants";
import { config } from "../../app/config/config";
import { ROUTES } from "../../routes/constants";

export const About = (): JSX.Element => {
  const { appKey } = config();

  if (appKey === APP_KEYS.GA2) {
    return <AboutViewGA2 />;
  }
  return <AboutView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT)) {
    return { notFound: true };
  }

  return {
    props: {
      pageTitle: "About",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default About;

About.Main = StyledPagesMain;
