import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { Fragment, JSX } from "react";
import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";
import { StyledStack } from "../../components/Docs/components/SectionContentCards/sectionContentCards.styles";
import { StyledSectionHero } from "../../components/Docs/components/SectionHero/sectionHero.styles";
import { CARDS } from "./constants";

export const LearnView = (): JSX.Element => {
  const isLmlsEnabled = useFeatureFlag("lmls");
  const filteredCards = CARDS.filter(
    (card) =>
      card.cardUrl !== "/learn/sequence-search-workflows" || isLmlsEnabled
  );

  return (
    <Fragment>
      <StyledSectionHero
        breadcrumbs={[
          { path: "/", text: "Home" },
          { path: "", text: "Learn" },
        ]}
        head="Learn"
        subHead={null}
      />
      <SectionContent
        content={
          <StyledStack>
            {filteredCards.map((card, index) => (
              <SectionContentCard key={index} {...card} />
            ))}
          </StyledStack>
        }
        frontmatter={null}
        pageTitle="Learn"
        slug={[]}
      />
    </Fragment>
  );
};
