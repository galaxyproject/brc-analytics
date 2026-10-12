import { ROUTES as SITE_ROUTES } from "@brc/routes/constants";
import { Link } from "@mui/material";
import { SectionHero } from "@repo/shared/components/layout/SectionHero/sectionHero";
import { LoganSearch } from "@repo/shared/components/LoganSearch/loganSearch";
import { type LoganSearchRoutes } from "@repo/shared/components/LoganSearch/types";
import { ROUTES } from "@repo/shared/routes/constants";
import NextLink from "next/link";
import { Fragment, type JSX } from "react";
import { SearchContainer, SearchSection } from "./loganSearchView.styles";

// BRC hands a finished search to its assistant; a site without one leaves
// assistantHref out and the button doesn't render.
const LOGAN_ROUTES: LoganSearchRoutes = {
  assistantHref: (jobId: string): string =>
    `${ROUTES.ASSISTANT}?loganJob=${encodeURIComponent(jobId)}`,
  searchPath: SITE_ROUTES.LOGAN_SEARCH,
};

const BREADCRUMBS = [
  { path: "/", text: "Home" },
  { path: SITE_ROUTES.LOGAN_SEARCH, text: "Logan Search" },
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
            <Link component={NextLink} href={SITE_ROUTES.LOGAN_SEARCH_LEARN}>
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
