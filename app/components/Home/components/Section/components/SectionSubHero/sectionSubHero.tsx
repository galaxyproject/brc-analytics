import { SubHeroContent } from "../../../../content";
import {
  Section,
  SectionLayout,
  SectionSubLayout,
  SmokeLightestBox,
  StyledBox,
  StyledButton,
  StyledGrid2,
  StyledTabs,
  Subhead,
  TransparentBox,
} from "./sectionSubHero.styles";
import { BUTTON, IMAGE, TAB } from "./instructions";
import { Fragment, useState } from "react";
import { Fade, Slide, Tab, Typography } from "@mui/material";
import { useCurrentBreakpoint } from "@databiosphere/findable-ui/lib/hooks/useCurrentBreakpoint";
import { TEXT_BODY_LARGE_400 } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { FADE_PROPS, SLIDE_PROPS, TABS_PROPS } from "./constants";

export const SectionSubHero = (): JSX.Element => {
  const bp = useCurrentBreakpoint() || "";
  const [step, setStep] = useState<string>("0");
  return (
    <Section>
      <SectionLayout>
        <SectionSubLayout>
          <Subhead>
            <SubHeroContent />
          </Subhead>
          <StyledTabs
            {...TABS_PROPS}
            onChange={(_, v) => setStep(v)}
            orientation={["md", "lg"].includes(bp) ? "vertical" : "horizontal"}
            value={step}
          >
            {Object.entries(TAB).map(([value, { description, label }]) => (
              <Tab
                key={value}
                label={
                  <Fragment>
                    <span>{label}</span>
                    {description && (
                      <Typography
                        color="ink.light"
                        variant={TEXT_BODY_LARGE_400}
                      >
                        {description}
                      </Typography>
                    )}
                  </Fragment>
                }
                value={value}
              />
            ))}
          </StyledTabs>
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
