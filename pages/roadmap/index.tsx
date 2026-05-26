import { GetStaticProps } from "next";
import { JSX } from "react";
import { getPageMeta } from "../../app/common/meta/utils";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { config } from "../../app/config/config";
import { RoadmapView } from "../../app/views/RoadmapView/roadmapView";
import { RoadmapViewGA2 } from "../../app/views/RoadmapView/roadmapViewGA2";
import { ROUTES } from "../../routes/constants";
import { APP_KEYS } from "../../site-config/common/constants";

export const Roadmap = (): JSX.Element => {
  const { appKey } = config();

  if (appKey === APP_KEYS.GA2) {
    return <RoadmapViewGA2 />;
  }
  return <RoadmapView />;
};

export const getStaticProps: GetStaticProps = async () => {
  const { allowedPaths, appKey } = config();

  if (allowedPaths && !allowedPaths.includes(ROUTES.ROADMAP)) {
    return { notFound: true };
  }

  return {
    props: {
      ...getPageMeta(appKey).ROADMAP,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Roadmap;

Roadmap.Main = StyledPagesMain;
