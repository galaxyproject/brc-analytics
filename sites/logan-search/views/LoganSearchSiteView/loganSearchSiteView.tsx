import { LoganHero } from "@logan/components/layout/LoganHero/loganHero";
import { ROUTES } from "@logan/routes/constants";
import { Link } from "@mui/material";
import { LoganSearch } from "@repo/shared/components/LoganSearch/loganSearch";
import { type LoganSearchRoutes } from "@repo/shared/components/LoganSearch/types";
import NextLink from "next/link";
import { Fragment, type JSX } from "react";
import { LOGAN_STATS } from "./constants";
import { SearchContainer, SearchSection } from "./loganSearchSiteView.styles";

// No assistantHref: the assistant lives on BRC Analytics, and whether this site
// hands off to it is still an open question.
const LOGAN_ROUTES: LoganSearchRoutes = {
  searchPath: ROUTES.SEARCH,
};

/**
 * The site's home page: a short hero, with the shared Logan search riding up
 * over its bottom edge.
 * @returns the search page.
 */
export const LoganSearchSiteView = (): JSX.Element => {
  return (
    <Fragment>
      <LoganHero
        head="Logan Search"
        stats={LOGAN_STATS}
        subHead={
          <Fragment>
            Paste a DNA sequence and find the SRA runs it occurs in.{" "}
            <Link component={NextLink} href={ROUTES.LEARN}>
              How it works
            </Link>
          </Fragment>
        }
        variant="home"
      />
      <SearchSection>
        <SearchContainer>
          <LoganSearch routes={LOGAN_ROUTES} />
        </SearchContainer>
      </SearchSection>
    </Fragment>
  );
};
