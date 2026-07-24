import { SectionVision } from "@/components/content";
import { SectionHero } from "@/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { Fragment, JSX } from "react";

export const VisionView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={[
          { path: "/", text: "Home" },
          { path: "/about", text: "About" },
          { path: "", text: "Vision" },
        ]}
        head="Vision"
        subHead="What we're building, who we're building it for, and our commitments to the research community."
      />
      <SectionVision />
    </Fragment>
  );
};
