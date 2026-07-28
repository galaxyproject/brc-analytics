import { JSX } from "react";
import { useKmindexSearch } from "../../hooks/useKmindexSearch";
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
