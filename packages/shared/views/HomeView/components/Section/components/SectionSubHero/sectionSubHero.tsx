import { AccordionDetails, AccordionSummary, Fade, Slide } from "@mui/material";
import { type JSX } from "react";
import { ACCORDION_PROPS, FADE_PROPS, SLIDE_PROPS } from "./constants";
import { useAutoCycle } from "./hooks/UseAutoCycle/hook";
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
  const indexKeys = steps.map((_, index) => String(index));
  const { activeIndex, onSelectIndex } = useAutoCycle(indexKeys);
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
                  <AccordionSummary>{title}</AccordionSummary>
                  {details && <AccordionDetails>{details}</AccordionDetails>}
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
                key={src}
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
