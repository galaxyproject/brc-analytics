import { Fragment } from "react";
import { StyledStack } from "./learnView.styles";
import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { CARDS } from "./constants";
import { StyledSectionHero } from "../../components/Docs/components/SectionHero/sectionHero.styles";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";

export const LearnView = (): JSX.Element => {
  return (
    <Fragment>
      <StyledSectionHero
        breadcrumbs={[
          { path: "/", text: "Home" },
          { path: "", text: "Learn About BRC Analytics" },
        ]}
        head="Learn About BRC Analytics"
        subHead={null}
      />
      <SectionContent
        content={
          <StyledStack>
            {CARDS.map((card, index) => (
              <SectionContentCard key={index} {...card} />
            ))}
          </StyledStack>
        }
        frontmatter={null}
        pageTitle="Learn About BRC Analytics"
        slug={[]}
      />
    </Fragment>
  );
};
