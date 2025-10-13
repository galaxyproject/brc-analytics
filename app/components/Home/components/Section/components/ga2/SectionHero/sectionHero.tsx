import { Button } from "@mui/material";
import { ROUTES } from "../../../../../../../../routes/constants";
import { BUTTON_PROPS } from "../../SectionHero/constants";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";
import { HeroImage } from "./components/HeroImage/heroImage";

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
