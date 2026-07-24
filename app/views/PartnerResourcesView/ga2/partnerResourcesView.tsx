import { SectionAbout } from "@/components/content/ga2";
import { SectionHero } from "@/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { Fragment, JSX } from "react";

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
        subHead="GenomeArk2 is a collaborative effort of four mature software and infrastructure projects that have been sustained for decades."
      />
      <SectionAbout />
    </Fragment>
  );
};
