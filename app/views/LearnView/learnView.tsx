import { Fragment, JSX } from "react";
import { SectionContentCard } from "../../components/common/Card/components/SectionContentCard/sectionContentCard";
import { SectionContent } from "../../components/Docs/components/SectionContent/sectionContent";
import { StyledSectionHero } from "../../components/Docs/components/SectionHero/sectionHero.styles";
import { CARDS } from "./constants";
import { StyledStack } from "./learnView.styles";

export const LearnView = (): JSX.Element => {
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
            {CARDS.map((card, index) => (
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
