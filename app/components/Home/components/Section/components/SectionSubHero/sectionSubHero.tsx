import { SubHeroContent } from "@/components/Home/content";
import { SectionSubHero as SharedSectionSubHero } from "@repo/shared/views/HomeView/components/Section/components/SectionSubHero/sectionSubHero";
import { type JSX } from "react";
import { CTAS, IMAGES, STEPS } from "./constants";

export const SectionSubHero = (): JSX.Element => (
  <SharedSectionSubHero
    content={<SubHeroContent />}
    ctas={CTAS}
    images={IMAGES}
    steps={STEPS}
  />
);
