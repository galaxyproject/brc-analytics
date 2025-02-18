import { SubHeroContent } from "../../../../content";
import {
  Section,
  SectionLayout,
  SectionSubLayout,
  StyledGrid2,
  StyledTabs,
  Subhead,
} from "./sectionSubHero.styles";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import { BUTTON, IMAGE, TAB } from "./constants";
import { Fragment, useState } from "react";
import { Button, Tab, Typography } from "@mui/material";
import { useCurrentBreakpoint } from "@databiosphere/findable-ui/lib/hooks/useCurrentBreakpoint";
import { TabScrollFuzz } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs.styles";
import { TEXT_BODY_LARGE_400 } from "@databiosphere/findable-ui/lib/theme/common/typography";

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
            allowScrollButtonsMobile
            onChange={(_, v) => setStep(v)}
            orientation={["md", "lg"].includes(bp) ? "vertical" : "horizontal"}
            ScrollButtonComponent={TabScrollFuzz}
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
          <StaticImage alt={TAB[step].label} src={IMAGE[step]} />
        </StyledGrid2>
        {BUTTON[step] && (
          <StyledGrid2>
            <Button {...BUTTON[step]} />
          </StyledGrid2>
        )}
      </SectionLayout>
    </Section>
  );
};
