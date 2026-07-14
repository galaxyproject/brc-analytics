import { SectionAboutGA2 } from "@/components/content";
import { SectionHero } from "@/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { Fragment, JSX } from "react";

export const PartnerResourcesViewGA2 = (): JSX.Element => {
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
      <SectionAboutGA2 />
    </Fragment>
  );
};
