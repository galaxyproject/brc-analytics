import { Fragment } from "react";
import { SectionRoadmapGA2 } from "../../components/content";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";
import { Typography } from "@mui/material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const RoadmapViewGA2 = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Roadmap"
        subHead={
          <>
            GenomeArk Analytics lets you combine VGP Phase 1, official
            NCBI, and your own data using Galaxy Platform. It simplifies
            large-scale bioinformatics, ensures reproducibility, and
            makes results easy to share with other researchers. Our goal
            is to create a{" "}
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
      <SectionRoadmapGA2 />
    </Fragment>
  );
};
