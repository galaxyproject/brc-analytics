import { SectionHero } from "@brc-analytics/core/components/Layout/components/Section/components/SectionHero/sectionHero";
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
            GenomeArk lets you combine VGP Phase 1, official NCBI, and your own
            data using the Galaxy Platform. We are extending the reach of the
            VGP project by making it simple to analyze those assemblies,
            generate new ones with proven workflows, and feed results back to
            the community. By emphasizing reproducibility, collaboration, and
            low-barrier access to large-scale bioinformatics, we help
            researchers turn high-quality genomes into actionable science.
          </>
        }
      />
      <SectionRoadmap />
    </Fragment>
  );
};
