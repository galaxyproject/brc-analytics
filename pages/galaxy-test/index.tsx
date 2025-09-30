import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { GalaxyJobView } from "../../app/views/GalaxyJobView/galaxyJobView";

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
