import { type JSX, useCallback, useEffect, useRef } from "react";
import { LoganSearchForm } from "./LoganSearchForm/loganSearchForm";
import { LoganSearchHistory } from "./LoganSearchHistory/loganSearchHistory";
import { type RecentSearch } from "./LoganSearchHistory/recentSearches";
import { useRecentSearches } from "./LoganSearchHistory/useRecentSearches";
import { LoganSearchJob } from "./LoganSearchJob/loganSearchJob";
import { type LoganSearchRoutes } from "./types";
import { useLoganSearch } from "./useLoganSearch";

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
 * The whole Logan search on one page: form, status, summary, filters,
 * results, cohort and recent searches. The Logan site splits the form and the
 * results across two pages instead and builds them from the same parts.
 * @param props - Component props.
 * @param props.routes - Where the search links to on the mounting site.
 * @returns The search.
 */
export const LoganSearch = ({ routes }: LoganSearchProps): JSX.Element => {
  const { filtering, filtersEnabled, search } = useLoganSearch();
  const history = useRecentSearches();

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

  return (
    <div>
      <LoganSearchForm onSubmitted={onSubmitted} search={search} />
      <LoganSearchJob
        assistantHref={routes.assistantHref}
        filtering={filtering}
        filtersEnabled={filtersEnabled}
        progressRef={progressRef}
        search={search}
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
