import { Fragment } from "react";
import { UnifiedSearch } from "../../components/LLMSearch";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { BREADCRUMBS } from "./common/constants";
import { SearchSection } from "./searchView.styles";

export const SearchView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="AI-Powered Search"
        subHead="Find datasets and workflows using natural language"
      />
      <SearchSection>
        <UnifiedSearch />
      </SearchSection>
    </Fragment>
  );
};
