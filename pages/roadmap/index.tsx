import { JSX } from "react";
import { GetStaticProps } from "next";
import { StyledPagesMain } from "../../app/components/Layout/components/Main/main.styles";
import { RoadmapView } from "../../app/views/RoadmapView/roadmapView";
import { RoadmapViewGA2 } from "../../app/views/RoadmapView/roadmapViewGA2";
import { BRC_PAGE_META } from "../../app/common/meta/brc/constants";
import { GA2_PAGE_META } from "../../app/common/meta/ga2/constants";
import { config } from "../../app/config/config";
import { APP_KEYS } from "../../site-config/common/constants";
import { ROUTES } from "../../routes/constants";

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

  const meta =
    appKey === APP_KEYS.GA2 ? GA2_PAGE_META.ROADMAP : BRC_PAGE_META.ROADMAP;

  return {
    props: {
      ...meta,
      themeOptions: {
        palette: { background: { default: "#FAFBFB" } }, // SMOKE_LIGHTEST
      },
    },
  };
};

export default Roadmap;

Roadmap.Main = StyledPagesMain;
