import { AboutContent } from "../../../../content";
import { Section } from "../../section.styles";
import { SectionLayout } from "./sectionAbout.styles";

export const SectionAbout = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <AboutContent />
      </SectionLayout>
    </Section>
  );
};
