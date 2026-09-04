import { LoganSearch } from "@brc/components/LoganSearch/loganSearch";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { Fragment, type JSX } from "react";
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
