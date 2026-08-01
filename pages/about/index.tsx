import { getPageMeta } from "@/common/meta/utils";
import { config } from "@/config/config";
import { AboutView } from "@brc/views/AboutView/aboutView";
import { AboutView as GA2AboutView } from "@ga2/views/AboutView/aboutView";
import type { PageProps } from "@pages/_app";
import { StyledPagesMain } from "@repo/shared/components/layout/Main/main.styles";
import { ROUTES } from "@routes/constants";
import { APP_KEYS } from "@site-config/common/constants";
import { type GetStaticProps } from "next";
import { type JSX } from "react";

export const About = (): JSX.Element => {
  const { appKey } = config();
  if (appKey === APP_KEYS.GA2) return <GA2AboutView />;
  return <AboutView />;
};

export const getStaticProps: GetStaticProps<
  Pick<PageProps, "pageDescription" | "pageTitle"> & {
    themeOptions: object;
  }
> = async () => {
  const { allowedPaths, appKey } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ABOUT)) {
    return { notFound: true };
  }

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
