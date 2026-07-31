import { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import { type SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import { SectionContentCards } from "@repo/shared/views/docs/components/SectionContentCards/sectionContentCards";
import { StyledSectionHero } from "@repo/shared/views/docs/components/SectionHero/sectionHero.styles";
import type { ComponentProps } from "react";
import { Fragment, type JSX } from "react";

interface AboutViewProps {
  cards: ComponentProps<typeof SectionContentCard>[];
}

export const AboutView = ({ cards }: AboutViewProps): JSX.Element => {
  return (
    <Fragment>
      <StyledSectionHero
        breadcrumbs={[
          { path: "/", text: "Home" },
          { path: "", text: "About" },
        ]}
        head="About"
        subHead={null}
      />
      <SectionContent
        content={<SectionContentCards cards={cards} />}
        frontmatter={null}
        pageTitle="About"
        slug={[]}
      />
    </Fragment>
  );
};
