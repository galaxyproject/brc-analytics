import { type JSX } from "react";
import { CTAS, IMAGES, STEPS } from "./constants";
import SubHeroContent from "./content/sectionSubHero.mdx";
import { StyledSectionSubHero } from "./sectionSubHero.styles";

export const SectionSubHero = (): JSX.Element => (
  <StyledSectionSubHero
    content={<SubHeroContent />}
    ctas={CTAS}
    images={IMAGES}
    steps={STEPS}
  />
);
