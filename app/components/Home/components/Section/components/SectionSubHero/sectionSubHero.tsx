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
import { useState } from "react";
import { Button, Tab } from "@mui/material";
import { useCurrentBreakpoint } from "@databiosphere/findable-ui/lib/hooks/useCurrentBreakpoint";
import { TabScrollFuzz } from "@databiosphere/findable-ui/lib/components/common/Tabs/tabs.styles";

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
            {Object.entries(TAB).map(([value, label]) => (
              <Tab key={value} label={label} value={value} />
            ))}
          </StyledTabs>
        </SectionSubLayout>
        <StyledGrid2>
          <StaticImage alt={TAB[step]} src={IMAGE[step]} />
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
