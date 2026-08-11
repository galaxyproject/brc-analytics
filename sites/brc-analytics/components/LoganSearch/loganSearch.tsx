import { useKmindexSearch } from "@repo/shared/hooks/useKmindexSearch";
import { type JSX } from "react";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchResults } from "./LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "./LoganSearchStatus/loganSearchStatus";

export const LoganSearch = (): JSX.Element => {
  const search = useKmindexSearch();

  return (
    <div>
      <LoganSearchForm search={search} />
      <LoganSearchStatus search={search} />
      <LoganSearchResults search={search} />
    </div>
  );
};
