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
          <Head>
            <span>Mapping life&apos;s code, </span>
            <span>one genome at a time</span>
          </Head>
          <SubHeadline>
            <Subhead>
              Access expertly curated sequencing and assembly data from the
              world&apos;s leading genome projects.
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
