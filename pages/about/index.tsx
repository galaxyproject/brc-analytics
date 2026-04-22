import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { AboutView } from "../../app/views/AboutView/aboutView";
import { AboutViewGA2 } from "../../app/views/AboutView/aboutViewGA2";
import { APP_KEYS } from "../../site-config/common/constants";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../app/common/meta/ga2/constants";
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
  const { allowedPaths, appKey } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT)) {
    return { notFound: true };
  }

  const meta =
    appKey === APP_KEYS.GA2 ? GA2_PAGE_META.ABOUT : BRC_PAGE_META.ABOUT;

  return {
    props: {
      ...meta,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default About;

About.Main = StyledPagesMain;
