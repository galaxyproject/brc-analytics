import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";
import { LoganSearchCohort } from "./LoganSearchCohort/loganSearchCohort";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchHistory } from "./LoganSearchHistory/loganSearchHistory";
import { useRecentSearches } from "./LoganSearchHistory/useRecentSearches";
import { LoganSearchResults } from "./LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "./LoganSearchStatus/loganSearchStatus";
import { LoganSearchSummary } from "./LoganSearchSummary/loganSearchSummary";

export const LoganSearch = (): JSX.Element => {
  const search = useKmindexSearch();
  const history = useRecentSearches();

  return (
    <div>
      <LoganSearchForm onSubmitted={history.record} search={search} />
      <LoganSearchStatus search={search} />
      <LoganSearchSummary search={search} />
      <LoganSearchResults search={search} />
      <LoganSearchCohort search={search} />
      <LoganSearchHistory
        currentJobId={search.jobId}
        onClear={history.clear}
        searches={history.searches}
      />
    </div>
  );
};
