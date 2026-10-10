import { LoganSearch } from "@brc/components/LoganSearch/loganSearch";
import { ROUTES } from "@brc/routes/constants";
import { Link } from "@mui/material";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import NextLink from "next/link";
import { Fragment, type JSX } from "react";
import { SearchContainer, SearchSection } from "./loganSearchView.styles";

const BREADCRUMBS = [
  { path: "/", text: "Home" },
  { path: ROUTES.LOGAN_SEARCH, text: "Logan Search" },
];

export const LoganSearchView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Logan Search"
        subHead={
          <Fragment>
            Search a DNA sequence against assembled contigs from the entire
            Sequence Read Archive, and get back the SRA accessions it occurs in.{" "}
            <Link component={NextLink} href={ROUTES.LOGAN_SEARCH_LEARN}>
              How it works
            </Link>
          </Fragment>
        }
      />
      <SearchSection>
        <SearchContainer>
          <LoganSearch />
        </SearchContainer>
      </SearchSection>
    </Fragment>
  );
};
