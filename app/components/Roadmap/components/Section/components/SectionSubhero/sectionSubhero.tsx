import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { Section } from "../../section.styles";
import { SectionLayout } from "./sectionSubhero.styles";

export const SectionSubhero = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <StaticImage alt="Roadmap" src="/roadmap/roadmap.svg" />
        <figcaption>
          The Data integration component will include utilization of existing
          API as well as design of new approaches for access of external data.
          The Data analysis component will consist of a globally accessible
          Galaxy instance deployed using ACCESS-CI/TACC resources. It will
          integrate hundreds of tools corresponding to each of the colored
          modules. In addition it will offer direct access to notebook
          environments such as Jupyter and RStudio allowing ad hoc analytics. A
          custom tools service will be offered to satisfy demands of users
          requesting missing or new components. We will provide a number of
          templates for deployment of serverless ObservableHQ-based dashboard
          that can be used to create rich visual representations of analytical
          results ranging from simple reports to Nationwide pathogen
          surveillance efforts. Finally, the Training component will embrace all
          aspects of the systems’ functionality and will include hundreds of
          interactive tutorials that can be used by users of all skill levels
          from computationally naive experimentalists to system engineers.
        </figcaption>
      </SectionLayout>
    </Section>
  );
};
