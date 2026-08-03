import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button } from "@mui/material";
import { ROUTES } from "@repo/shared/routes/constants";
import { type JSX } from "react";
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
            <Button
              {...BUTTON_PROPS.PRIMARY_LARGE_CONTAINED}
              href={ROUTES.ORGANISMS}
            >
              Get started
            </Button>
          </SubHeadline>
        </Headline>
        <HeroImage />
      </SectionLayout>
    </StyledSection>
  );
};
