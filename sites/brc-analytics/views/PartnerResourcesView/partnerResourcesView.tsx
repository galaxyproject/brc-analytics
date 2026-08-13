import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { Fragment, type JSX } from "react";
import SectionAbout from "./content/sectionAbout.mdx";

export const PartnerResourcesView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={[
          { path: "/", text: "Home" },
          { path: "/about", text: "About" },
          { path: "", text: "Partner Resources" },
        ]}
        head="Partner Resources"
        subHead="BRC Analytics is a collaborative effort of four mature software and infrastructure projects that have been sustained for decades."
      />
      <SectionAbout />
    </Fragment>
  );
};
