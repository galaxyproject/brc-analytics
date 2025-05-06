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
  StyledGrid,
  Subhead,
  TransparentBox,
} from "./sectionSubHero.styles";
import { ACCORDION, BUTTON, IMAGE } from "./instructions";
import { AccordionDetails, AccordionSummary, Fade, Slide } from "@mui/material";
import { ACCORDION_PROPS, FADE_PROPS, SLIDE_PROPS } from "./constants";
import { useAutoCycle } from "./hooks";

export const SectionSubHero = (): JSX.Element => {
  const accordionKeys = Object.keys(ACCORDION);
  const { activeIndex, onSelectIndex } = useAutoCycle(accordionKeys);
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
                expanded={activeIndex === value}
                onClick={() => onSelectIndex(value)}
              >
                <AccordionSummary>{title}</AccordionSummary>
                {details && <AccordionDetails>{details}</AccordionDetails>}
              </StyledAccordion>
            ))}
          </AccordionBox>
        </SectionSubLayout>
        <StyledGrid>
          <SmokeLightestBox>
            {Object.entries(IMAGE).map(([value, src]) => (
              <Slide {...SLIDE_PROPS} key={value} in={activeIndex === value}>
                <StyledBox sx={{ background: `url(${src})` }} />
              </Slide>
            ))}
          </SmokeLightestBox>
          <TransparentBox>
            {Object.entries(BUTTON).map(([value, buttonProps]) => (
              <Fade {...FADE_PROPS} key={value} in={activeIndex === value}>
                <StyledButton {...buttonProps} />
              </Fade>
            ))}
          </TransparentBox>
        </StyledGrid>
      </SectionLayout>
    </Section>
  );
};
