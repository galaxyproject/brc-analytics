import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import {
  type KmindexResults,
  useKmindexSearch,
} from "@repo/shared/hooks/useKmindexSearch";
import { useKmindexSummary } from "@repo/shared/hooks/useKmindexSummary";
import { type JSX, useCallback, useEffect, useMemo, useRef } from "react";
import { LoganSearchCohort } from "./LoganSearchCohort/loganSearchCohort";
import { LoganSearchFilterBar } from "./LoganSearchFilters/loganSearchFilterBar";
import { type LoganFilterControls } from "./LoganSearchFilters/types";
import { useLoganFilters } from "./LoganSearchFilters/useLoganFilters";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchHistory } from "./LoganSearchHistory/loganSearchHistory";
import { type RecentSearch } from "./LoganSearchHistory/recentSearches";
import { useRecentSearches } from "./LoganSearchHistory/useRecentSearches";
import { LoganSearchResults } from "./LoganSearchResults/loganSearchResults";
import { LoganSearchStatus } from "./LoganSearchStatus/loganSearchStatus";
import { LoganSearchSummary } from "./LoganSearchSummary/loganSearchSummary";
import { SearchProgress } from "./loganSearch.styles";
import { type LoganSearchRoutes } from "./types";

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

/**
 * Bring an element to the top of the viewport, without the glide for anyone
 * who has asked the OS for less motion.
 * @param element - What to show.
 */
function revealElement(element: HTMLElement | null): void {
  if (!element) return;
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView?.({
    behavior: still ? "auto" : "smooth",
    block: "start",
  });
}

interface LoganSearchProps {
  routes: LoganSearchRoutes;
}

/**
 * The whole Logan search: form, status, summary, filters, results, cohort and
 * recent searches. Each site mounts it inside its own view.
 * @param props - Component props.
 * @param props.routes - Where the search links to on the mounting site.
 * @returns The search.
 */
export const LoganSearch = ({ routes }: LoganSearchProps): JSX.Element => {
  const filtersEnabled = useFeatureFlag(FEATURE_FLAGS.LOGAN_FILTERS);
  const filtering = useLoganFilters(filtersEnabled);
  const search = useKmindexSearch(filtering.query);
  const summary = useKmindexSummary(
    search.jobId,
    filtering.query,
    Boolean(search.results)
  );
  const history = useRecentSearches();

  // A filter belongs to the search it was picked on. Reattaching to ?job= on
  // load keeps the filter in the URL; moving to another job drops it.
  const { clear } = filtering;
  const lastJobRef = useRef(search.jobId);
  useEffect(() => {
    if (lastJobRef.current && lastJobRef.current !== search.jobId) clear();
    lastJobRef.current = search.jobId;
  }, [clear, search.jobId]);

  // The form is taller than most screens, so the job card and the results that
  // replace it land below the fold. Without this, the only sign Search did
  // anything is the scrollbar changing.
  const progressRef = useRef<HTMLDivElement>(null);
  const awaitingRef = useRef(false);
  const { record } = history;
  const onSubmitted = useCallback(
    (entry: RecentSearch): void => {
      record(entry);
      awaitingRef.current = true;
      // After the paint that renders the job card, so there is one to show.
      requestAnimationFrame(() => revealElement(progressRef.current));
    },
    [record]
  );
  // A failed submit says why in the same spot, and is just as easy to miss.
  // Once per error, not again when the results change under it.
  const { error } = search;
  const hasResults = Boolean(search.results);
  const revealedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== revealedErrorRef.current && !hasResults)
      revealElement(progressRef.current);
    revealedErrorRef.current = error;
  }, [error, hasResults]);
  // The job card sits as low as the page could scroll, so the summary that
  // replaces it starts low too. Bring it up once, but only for someone still
  // watching the card, never someone who has scrolled off to read the form.
  useEffect(() => {
    if (!hasResults || !awaitingRef.current) return;
    awaitingRef.current = false;
    const element = progressRef.current;
    const top = element?.getBoundingClientRect().top ?? -1;
    if (top >= 0 && top < window.innerHeight) revealElement(element);
  }, [hasResults]);

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
    <div>
      <LoganSearchForm onSubmitted={onSubmitted} search={search} />
      <SearchProgress ref={progressRef}>
        <LoganSearchStatus search={search} />
        <LoganSearchSummary
          assistantHref={routes.assistantHref}
          search={search}
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
      <LoganSearchHistory
        currentJobId={search.jobId}
        onClear={history.clear}
        searchPath={routes.searchPath}
        searches={history.searches}
      />
    </div>
  );
};
