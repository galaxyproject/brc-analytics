import { SubHeroContent } from "@/components/Home/content/ga2";
import { type JSX } from "react";
import { CTAS, IMAGES, STEPS } from "./constants";
import { StyledSectionSubHero } from "./sectionSubHero.styles";

export const SectionSubHero = (): JSX.Element => (
  <StyledSectionSubHero
    content={<SubHeroContent />}
    ctas={CTAS}
    images={IMAGES}
    steps={STEPS}
  />
);
