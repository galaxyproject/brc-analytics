import { BUTTON_PROPS } from "@/components/Home/components/Section/components/SectionHero/constants";
import { ROUTES } from "@brc-analytics/core/routes/constants";
import { Button } from "@mui/material";
import { JSX } from "react";
import { HeroImage } from "./components/HeroImage/heroImage";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";

export const SectionHero = (): JSX.Element => {
  return (
    <StyledSection>
      <SectionLayout>
        <Headline>
          <Head>VGP Phase I genomes ready for analysis</Head>
          <SubHeadline>
            <Subhead>
              Select assembly, view it, and analyze without leaving the browser.
            </Subhead>
            <Button {...BUTTON_PROPS} href={ROUTES.ORGANISMS}>
              Get started
            </Button>
          </SubHeadline>
        </Headline>
        <HeroImage />
      </SectionLayout>
    </StyledSection>
  );
};
