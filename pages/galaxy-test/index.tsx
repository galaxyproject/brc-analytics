import { StyledPagesMain } from "@/components/Layout/components/Main/main.styles";
import { GalaxyJobView } from "@/views/GalaxyJobView/galaxyJobView";
import { GetStaticProps } from "next";
import { JSX } from "react";

export const GalaxyJob = (): JSX.Element => {
  return <GalaxyJobView />;
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      pageTitle: "Galaxy Integration Test",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default GalaxyJob;

GalaxyJob.Main = StyledPagesMain;
