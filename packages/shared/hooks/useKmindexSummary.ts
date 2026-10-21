import { API_BASE_URL } from "@repo/shared/config/api";
import {
  type KmindexCohort,
  type KmindexGeography,
} from "@repo/shared/hooks/useKmindexSearch";
import ky, { HTTPError } from "ky";
import { useEffect, useState } from "react";

// The cohort and geography of a filtered match set, in the shapes the
// unfiltered results carry. Headline counts apply every filter; each
// breakdown is counted with every filter except its own.
export interface KmindexSummary {
  cohort: KmindexCohort;
  geography: KmindexGeography;
  // Rows of the match set the filter keeps.
  matched: number;
  // Rows of the whole match set.
  total_matches: number;
}

export interface KmindexSummaryState {
  error: string | null;
  isLoading: boolean;
  // The summary for the filter currently asked for; null before it lands, and
  // whenever there is no filter.
  summary: KmindexSummary | null;
}

const IDLE: KmindexSummaryState = {
  error: null,
  isLoading: false,
  summary: null,
};

/**
 * The reason a summary request failed, for the reader.
 * @param error - Whatever ky threw.
 * @returns A sentence.
 */
async function describeFailure(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const { detail } = await error.response.json<{ detail?: unknown }>();
      if (
        detail &&
        typeof detail === "object" &&
        typeof (detail as { reason?: unknown }).reason === "string"
      )
        return (detail as { reason: string }).reason;
    } catch {
      // Fall through to the generic sentence.
    }
  }
  return "The filtered breakdown could not be loaded.";
}

/**
 * Fetch the filtered cohort and geography for a job.
 *
 * Asks nothing while `filterQuery` is empty or the job's results have not
 * landed, so with no filter the page makes exactly the requests it always did
 * and the views read the unfiltered cohort off the results.
 * @param jobId - The kmindex job, or null.
 * @param filterQuery - f.* filter parameters as a query string.
 * @param ready - Whether the job's results have landed, i.e. its aggregate
 * (and the export the filter runs over) exists.
 * @returns The summary state.
 */
export function useKmindexSummary(
  jobId: string | null,
  filterQuery: string,
  ready: boolean
): KmindexSummaryState {
  const [state, setState] = useState<KmindexSummaryState>(IDLE);
  const active = Boolean(jobId && filterQuery && ready);

  useEffect(() => {
    if (!active || !jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a summary for an old filter must not outlive it
      setState(IDLE);
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, error: null, isLoading: true }));
    ky.get(`${API_BASE_URL}/galaxy/kmindex/jobs/${jobId}/summary`, {
      credentials: "include",
      searchParams: new URLSearchParams(filterQuery),
      timeout: 120000,
    })
      .json<KmindexSummary>()
      .then((summary) => {
        if (cancelled) return;
        // A 202 is not thrown and carries {detail}; it is not a summary.
        if (!summary?.cohort) {
          setState({
            error: "The filtered breakdown is not ready yet.",
            isLoading: false,
            summary: null,
          });
          return;
        }
        setState({ error: null, isLoading: false, summary });
      })
      .catch(async (error: unknown) => {
        const message = await describeFailure(error);
        if (!cancelled)
          setState({ error: message, isLoading: false, summary: null });
      });
    return (): void => {
      cancelled = true;
    };
  }, [active, filterQuery, jobId]);

  return state;
}
