import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../../app/common/meta/utils";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { config } from "../../app/config/config";
import { AboutView } from "../../app/views/AboutView/aboutView";
import {
  BRC_CARDS,
  GA2_CARDS,
} from "../../app/views/AboutView/common/constants";
import { APP_KEYS } from "../../site-config/common/constants";
import type { PageProps } from "../_app";

export const About = (): JSX.Element => {
  const { appKey } = config();
  return <AboutView cards={appKey === APP_KEYS.GA2 ? GA2_CARDS : BRC_CARDS} />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  const { appKey } = config();
  return {
    props: {
      ...getPageMeta(appKey).ABOUT,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default About;

About.Main = StyledPagesMain;
