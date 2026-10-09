import { ROUTES } from "@logan/routes/constants";
import { Link } from "@mui/material";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { LoganSearch } from "@repo/shared/components/LoganSearch/loganSearch";
import { type LoganSearchRoutes } from "@repo/shared/components/LoganSearch/types";
import NextLink from "next/link";
import { Fragment, type JSX } from "react";
import { SearchContainer, SearchSection } from "./loganSearchSiteView.styles";

// No assistantHref: the assistant lives on BRC Analytics, and whether this site
// hands off to it is still an open question.
const LOGAN_ROUTES: LoganSearchRoutes = {
  searchPath: ROUTES.SEARCH,
};

/**
 * The site's home page: a short hero around the shared Logan search.
 * @returns the search page.
 */
export const LoganSearchSiteView = (): JSX.Element => {
  return (
    <Fragment>
      <SectionHero
        breadcrumbs={[]}
        head="Logan Search"
        subHead={
          <Fragment>
            Search a DNA sequence against assembled contigs from the entire
            Sequence Read Archive, and get back the SRA accessions it occurs in.{" "}
            <Link component={NextLink} href={ROUTES.LEARN}>
              How it works
            </Link>
          </Fragment>
        }
      />
      <SearchSection>
        <SearchContainer>
          <LoganSearch routes={LOGAN_ROUTES} />
        </SearchContainer>
      </SearchSection>
    </Fragment>
  );
};
