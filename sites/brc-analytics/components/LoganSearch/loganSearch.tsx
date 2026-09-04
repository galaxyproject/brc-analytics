import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";
import { LoganSearchAnalyze } from "./LoganSearchAnalyze/loganSearchAnalyze";
import { LoganSearchCohort } from "./LoganSearchCohort/loganSearchCohort";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchResults } from "./LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "./LoganSearchStatus/loganSearchStatus";

export const LoganSearch = (): JSX.Element => {
  const search = useKmindexSearch();

  return (
    <div>
      <LoganSearchForm search={search} />
      <LoganSearchStatus search={search} />
      <LoganSearchCohort search={search} />
      <LoganSearchAnalyze search={search} />
      <LoganSearchResults search={search} />
    </div>
  );
};
