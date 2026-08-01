import { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import { StyledSectionHero } from "@repo/shared/views/docs/components/SectionHero/sectionHero.styles";
import { Fragment, type JSX } from "react";
import type { Props } from "./types";

export const ContentIndexView = ({ slotProps }: Props): JSX.Element => {
  return (
    <Fragment>
      <StyledSectionHero {...slotProps.hero} />
      <SectionContent {...slotProps.content} />
    </Fragment>
  );
};
