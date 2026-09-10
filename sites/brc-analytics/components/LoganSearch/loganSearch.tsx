import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";
import { LoganSearchCohort } from "./LoganSearchCohort/loganSearchCohort";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchResults } from "./LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "./LoganSearchStatus/loganSearchStatus";
import { LoganSearchSummary } from "./LoganSearchSummary/loganSearchSummary";

export const LoganSearch = (): JSX.Element => {
  const search = useKmindexSearch();

  return (
    <div>
      <LoganSearchForm search={search} />
      <LoganSearchStatus search={search} />
      <LoganSearchSummary search={search} />
      <LoganSearchResults search={search} />
      <LoganSearchCohort search={search} />
    </div>
  );
};
