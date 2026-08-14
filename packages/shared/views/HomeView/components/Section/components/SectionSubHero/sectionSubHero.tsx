import { AccordionDetails, AccordionSummary, Fade, Slide } from "@mui/material";
import { type JSX } from "react";
import { ACCORDION_PROPS, FADE_PROPS, SLIDE_PROPS } from "./constants";
import { useActiveIndex } from "./hooks/UseActiveIndex/hook";
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
import { type Props } from "./types";

export const SectionSubHero = ({
  className,
  content,
  ctas,
  images,
  steps,
}: Props): JSX.Element => {
  const { activeIndex, onSelectIndex } = useActiveIndex(
    steps.length > 0 ? "0" : ""
  );
  return (
    <Section className={className}>
      <SectionLayout>
        <SectionSubLayout>
          <Subhead>{content}</Subhead>
          <AccordionBox>
            {steps.map(({ details, title }, index) => {
              const key = String(index);
              return (
                <StyledAccordion
                  {...ACCORDION_PROPS}
                  key={key}
                  expanded={activeIndex === key}
                  onClick={() => onSelectIndex(key)}
                >
                  {/* MUI's Accordion re-renders its children as an array inside
                      MuiAccordionRegion, so these static siblings need keys to
                      avoid React's list-key warning. */}
                  <AccordionSummary key="summary">{title}</AccordionSummary>
                  {details && (
                    <AccordionDetails key="details">{details}</AccordionDetails>
                  )}
                </StyledAccordion>
              );
            })}
          </AccordionBox>
        </SectionSubLayout>
        <StyledGrid>
          <SmokeLightestBox>
            {images.map((src, index) => (
              <Slide
                {...SLIDE_PROPS}
                key={String(index)}
                in={activeIndex === String(index)}
              >
                <StyledBox sx={{ background: `url(${src})` }} />
              </Slide>
            ))}
          </SmokeLightestBox>
          <TransparentBox>
            {ctas.map((cta, index) => (
              <Fade
                {...FADE_PROPS}
                key={String(index)}
                in={activeIndex === String(index)}
              >
                <StyledButton {...cta} />
              </Fade>
            ))}
          </TransparentBox>
        </StyledGrid>
      </SectionLayout>
    </Section>
  );
};
