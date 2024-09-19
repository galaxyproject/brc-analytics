import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { Fragment } from "react";
import { SectionAbout } from "../../components/About/components/Section/components/SectionAbout/sectionAbout";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";

export const AboutView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="About BRC-Analytics"
        subHead={
          <span>
            BRC-analytics is a collaborative effort of four projects. These
            include: <Link label="Galaxy" url="https://galaxyproject.org" />{" "}
            (est. 2005), <Link label="HyPhy" url="https://hyphy.org" /> (est.
            2000),{" "}
            <Link label="UCSC Genome Browser" url="https://genome.ucsc.edu" />{" "}
            (est. 2000), and{" "}
            <Link label="TACC" url="https://tacc.utexas.edu/" /> (est. 2001).
            What are these resources?
          </span>
        }
      />
      <SectionAbout />
    </Fragment>
  );
};
