import { SubHeroContent } from "../../../../content";
import {
  AccordionBox,
  Section,
  SectionLayout,
  SectionSubLayout,
  SmokeLightestBox,
  StyledAccordion,
  StyledBox,
  StyledButton,
  StyledGrid2,
  Subhead,
  TransparentBox,
} from "./sectionSubHero.styles";
import { ACCORDION, BUTTON, IMAGE } from "./instructions";
import { useState } from "react";
import { AccordionDetails, AccordionSummary, Fade, Slide } from "@mui/material";
import { ACCORDION_PROPS, FADE_PROPS, SLIDE_PROPS } from "./constants";

export const SectionSubHero = (): JSX.Element => {
  const [step, setStep] = useState<string>("0");
  return (
    <Section>
      <SectionLayout>
        <SectionSubLayout>
          <Subhead>
            <SubHeroContent />
          </Subhead>
          <AccordionBox>
            {Object.entries(ACCORDION).map(([value, { details, title }]) => (
              <StyledAccordion
                {...ACCORDION_PROPS}
                key={value}
                disabled={!details}
                expanded={step === value}
                onClick={() => setStep(value)}
              >
                <AccordionSummary>{title}</AccordionSummary>
                <AccordionDetails>{details}</AccordionDetails>
              </StyledAccordion>
            ))}
          </AccordionBox>
        </SectionSubLayout>
        <StyledGrid2>
          <SmokeLightestBox>
            {Object.entries(IMAGE).map(([value, src]) => (
              <Slide {...SLIDE_PROPS} key={value} in={step === value}>
                <StyledBox sx={{ background: `url(${src})` }} />
              </Slide>
            ))}
          </SmokeLightestBox>
          <TransparentBox>
            {Object.entries(BUTTON).map(([value, buttonProps]) => (
              <Fade {...FADE_PROPS} key={value} in={step === value}>
                <StyledButton {...buttonProps} />
              </Fade>
            ))}
          </TransparentBox>
        </StyledGrid2>
      </SectionLayout>
    </Section>
  );
};
