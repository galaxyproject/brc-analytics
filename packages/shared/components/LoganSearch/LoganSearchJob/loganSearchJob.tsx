import { LoganSearchCohort } from "@repo/shared/components/LoganSearch/LoganSearchCohort/loganSearchCohort";
import { LoganSearchFilterBar } from "@repo/shared/components/LoganSearch/LoganSearchFilters/loganSearchFilterBar";
import { type LoganFilterControls } from "@repo/shared/components/LoganSearch/LoganSearchFilters/types";
import { type UseLoganFilters } from "@repo/shared/components/LoganSearch/LoganSearchFilters/useLoganFilters";
import { LoganSearchResults } from "@repo/shared/components/LoganSearch/LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "@repo/shared/components/LoganSearch/LoganSearchStatus/loganSearchStatus";
import { LoganSearchSummary } from "@repo/shared/components/LoganSearch/LoganSearchSummary/loganSearchSummary";
import { SearchProgress } from "@repo/shared/components/LoganSearch/loganSearch.styles";
import {
  type KmindexResults,
  type useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { useKmindexSummary } from "@repo/shared/hooks/useKmindexSummary";
import { Fragment, type JSX, type Ref, useMemo } from "react";

/**
 * Why a search's results cannot be filtered, if they cannot.
 *
 * Filtering runs over the export on disk. Without one it is refused outright
 * rather than run over the capped listing, which would answer for the top of
 * the score range and call it the match set.
 * @param results - The landed results page.
 * @returns A sentence, or null when filtering can run.
 */
function filterDisabledReason(results: KmindexResults): string | null {
  if (results.export_status === "available") return null;
  if (results.export_status === "too_large")
    return "Filtering needs the full match set on disk, and this search matched too many runs for one to be prepared.";
  return "Filtering needs the full match set on disk, and it is not available for this search.";
}

interface LoganSearchJobProps {
  assistantHref?: (jobId: string) => string;
  filtering: UseLoganFilters;
  filtersEnabled: boolean;
  // The job card and the summary that replaces it, for a page that scrolls
  // to them on submit.
  progressRef?: Ref<HTMLDivElement>;
  search: ReturnType<typeof useKmindexSearch>;
  // False where the page already says which job and query this is, and
  // offers the link to it.
  withProvenance?: boolean;
}

/**
 * Everything about one search after it is submitted: its status, then the
 * summary, filters, hit table and cohort once it lands.
 * @param props - Component props.
 * @param props.assistantHref - Builds the assistant handoff link, if any.
 * @param props.filtering - The filters over the results.
 * @param props.filtersEnabled - Whether filtering is switched on.
 * @param props.progressRef - Ref to the status and summary block.
 * @param props.search - The kmindex search hook.
 * @param props.withProvenance - Whether the summary names the job and query.
 * @returns The job's results.
 */
export const LoganSearchJob = ({
  assistantHref,
  filtering,
  filtersEnabled,
  progressRef,
  search,
  withProvenance = true,
}: LoganSearchJobProps): JSX.Element => {
  const summary = useKmindexSummary(
    search.jobId,
    filtering.query,
    Boolean(search.results)
  );

  const { results } = search;
  const controls = useMemo((): LoganFilterControls | undefined => {
    if (!filtersEnabled || !results) return undefined;
    return {
      disabledReason: filterDisabledReason(results),
      filters: filtering.filters,
      onToggle: filtering.toggle,
      onToggleYear: filtering.toggleYear,
    };
  }, [
    filtering.filters,
    filtering.toggle,
    filtering.toggleYear,
    filtersEnabled,
    results,
  ]);

  return (
    <Fragment>
      <SearchProgress ref={progressRef}>
        <LoganSearchStatus search={search} />
        <LoganSearchSummary
          assistantHref={assistantHref}
          search={search}
          withProvenance={withProvenance}
        />
      </SearchProgress>
      {controls && results && (
        <LoganSearchFilterBar
          disabledReason={controls.disabledReason}
          filterError={search.filterError}
          filtering={filtering}
          results={results}
          summary={summary}
        />
      )}
      <LoganSearchResults search={search} />
      <LoganSearchCohort
        filtering={controls}
        search={search}
        summary={summary}
      />
    </Fragment>
  );
};
