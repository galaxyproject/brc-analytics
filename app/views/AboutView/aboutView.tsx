import { SectionContentCard } from "@/components/common/Card/components/SectionContentCard/sectionContentCard";
import { StyledStack } from "@/components/Docs/components/SectionContentCards/sectionContentCards.styles";
import { StyledSectionHero } from "@/components/Docs/components/SectionHero/sectionHero.styles";
import { SectionContent } from "@repo/shared/views/docs/components/SectionContent/sectionContent";
import { type ComponentProps, Fragment, type JSX } from "react";

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
        content={
          <StyledStack>
            {cards.map((card) => (
              <SectionContentCard key={card.cardUrl} {...card} />
            ))}
          </StyledStack>
        }
        frontmatter={null}
        pageTitle="About"
        slug={[]}
      />
    </Fragment>
  );
};
