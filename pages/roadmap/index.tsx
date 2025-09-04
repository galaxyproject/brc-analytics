import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { RoadmapView } from "../../app/views/RoadmapView/roadmapView";
import { config } from "../../app/config/config";
import { ROUTES } from "../../routes/constants";

export const Roadmap = (): JSX.Element => {
  return <RoadmapView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ROADMAP)) {
    return { notFound: true };
  }

  return {
    props: {
      pageTitle: "Roadmap",
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Roadmap;

Roadmap.Main = StyledPagesMain;
