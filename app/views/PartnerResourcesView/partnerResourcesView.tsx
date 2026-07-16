import { SectionAbout } from "@/components/content";
import { SectionHero } from "@brc-analytics/core/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
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
        subHead="BRC Analytics is a collaborative effort of four mature software and infrastructure projects that have been sustained for decades."
      />
      <SectionAbout />
    </Fragment>
  );
};
