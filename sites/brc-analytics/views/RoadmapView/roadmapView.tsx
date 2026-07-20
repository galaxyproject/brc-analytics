import { SectionHero } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/sectionHero";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Typography } from "@mui/material";
import { Fragment, JSX } from "react";
import { BREADCRUMBS } from "./constants";
import SectionRoadmap from "./content/sectionRoadmap.mdx";

export const RoadmapView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Roadmap"
        subHead={
          <>
            BRC Analytics aims to seamlessly integrate data from NCBI, analysis
            tools from Galaxy, and comparative genomics capabilities. We will
            highlight and provide dedicated resources for priority pathogens
            while simultaneously supporting neglected organisms. Our goal is to
            create a{" "}
            <Typography
              component="span"
              variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_500}
            >
              community-driven knowledge platform
            </Typography>{" "}
            that lowers barriers to entry for complex bioinformatics analyses.
          </>
        }
      />
      <SectionRoadmap />
    </Fragment>
  );
};
