import type { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import type { StyledSectionHero } from "@repo/shared/views/docs/components/SectionHero/sectionHero.styles";
import type { ComponentProps } from "react";

export interface Props {
  slotProps: {
    content: ComponentProps<typeof SectionContent>;
    hero: ComponentProps<typeof StyledSectionHero>;
  };
}
