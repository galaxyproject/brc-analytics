import { editSearchHref, ROUTES } from "@logan/routes/constants";
import {
  ResultsSection,
  SearchContainer,
} from "@logan/views/LoganSearchSiteView/loganSearchSiteView.styles";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { LoganQueryStrip } from "@repo/shared/components/LoganSearch/LoganQueryStrip/loganQueryStrip";
import { useRecentSearches } from "@repo/shared/components/LoganSearch/LoganSearchHistory/useRecentSearches";
import { LoganSearchJob } from "@repo/shared/components/LoganSearch/LoganSearchJob/loganSearchJob";
import { useLoganSearch } from "@repo/shared/components/LoganSearch/useLoganSearch";
import { type JSX, useEffect, useState } from "react";

/**
 * One search's results: the query strip, then the job card while it runs and
 * the summary, filters, table and cohort once it lands.
 * @returns the results page.
 */
export const LoganResultsView = (): JSX.Element => {
  const { filtering, filtersEnabled, search } = useLoganSearch();
  const { searches } = useRecentSearches();
  // Set after mount, once the URL is readable: a bare /results has nothing
  // to show and should say so rather than sit empty.
  const [noJob, setNoJob] = useState(false);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("job"))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount
      setNoJob(true);
  }, []);

  const { jobId } = search;
  const entry = searches.find((search) => search.jobId === jobId);

  return (
    <ResultsSection>
      <SearchContainer>
        {noJob && (
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h6">
                No search to show
              </Typography>
              <Typography color="textSecondary" gutterBottom variant="body2">
                A results link names the search it belongs to, and this one
                doesn&apos;t.
              </Typography>
              <Button href={ROUTES.SEARCH} variant="contained">
                Start a search
              </Button>
            </CardContent>
          </Card>
        )}
        {jobId && (
          <div>
            <LoganQueryStrip
              editHref={editSearchHref}
              entry={entry}
              jobId={jobId}
              newHref={ROUTES.SEARCH}
              registered={search.indexes}
              results={search.results}
            />
            <LoganSearchJob
              filtering={filtering}
              filtersEnabled={filtersEnabled}
              search={search}
              withProvenance={false}
            />
          </div>
        )}
      </SearchContainer>
    </ResultsSection>
  );
};
