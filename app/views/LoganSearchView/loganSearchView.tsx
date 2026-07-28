import { Fragment, JSX } from "react";
import { SectionHero } from "../../components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { LoganSearch } from "../../components/LoganSearch/loganSearch";
import { SearchContainer, SearchSection } from "./loganSearchView.styles";

const BREADCRUMBS = [
  { path: "/", text: "Home" },
  { path: "/logan-search", text: "Logan Search" },
];

export const LoganSearchView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Logan Search"
        subHead="Search a DNA sequence against assembled contigs from the entire Sequence Read Archive, and get back the SRA accessions it occurs in"
      />
      <SearchSection>
        <SearchContainer>
          <LoganSearch />
        </SearchContainer>
      </SearchSection>
    </Fragment>
  );
};
