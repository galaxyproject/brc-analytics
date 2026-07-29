import { API_BASE_URL } from "@repo/shared/config/api";
import ky from "ky";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SraRunMetadata {
  assay_type: string | null;
  bioproject: string | null;
  country: string | null;
  instrument: string | null;
  library_layout: string | null;
  mbases: number | null;
  organism: string | null;
  platform: string | null;
  release_date: string | null;
  study: string | null;
}

export interface KmindexHit {
  accession: string;
  score: number;
  shard: string;
  sra: SraRunMetadata | null;
}

export interface KmindexResults {
  hits: KmindexHit[];
  job_id: string;
  limit: number;
  offset: number;
  query_name: string | null;
  shards_failed: number;
  shards_searched: number;
  shards_with_hits: number;
  sra_annotated: number;
  sra_mirror_available: boolean;
  total_hits: number;
  truncated: boolean;
}

export interface KmindexJobStatus {
  is_complete: boolean;
  is_successful: boolean;
  job_id: string;
  state: string;
  stderr?: string;
}

export interface KmindexSubmission {
  index: string;
  sequence: string;
  threshold: number;
  zvalue: number;
}

interface KmindexSearchState {
  error: string | null;
  indexes: string[];
  isLoadingIndexes: boolean;
  isLoadingResults: boolean;
  isSubmitting: boolean;
  jobId: string | null;
  jobStatus: KmindexJobStatus | null;
  results: KmindexResults | null;
}

interface KmindexSearchActions {
  goToPage: (offset: number) => Promise<void>;
  reset: () => void;
  submit: (submission: KmindexSubmission) => Promise<void>;
}

const POLLING_INTERVAL = 3000;
export const PAGE_SIZE = 25;

const INITIAL_STATE: KmindexSearchState = {
  error: null,
  indexes: [],
  isLoadingIndexes: true,
  isLoadingResults: false,
  isSubmitting: false,
  jobId: null,
  jobStatus: null,
  results: null,
};

/**
 * Pull a readable message out of a ky HTTPError, falling back to its status.
 * @param error - Error thrown by ky.
 * @param fallback - Message to use when nothing better is available.
 * @returns Human-readable error message.
 */
async function toErrorMessage(
  error: unknown,
  fallback: string
): Promise<string> {
  if (error && typeof error === "object" && "response" in error) {
    const { response } = error as {
      response: { json: () => Promise<{ detail?: string }>; status: number };
    };
    try {
      const body = await response.json();
      return body.detail || `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Put the running job in the URL, or clear it.
 *
 * replaceState rather than pushState: successive searches shouldn't stack up
 * as history entries the Back button walks through one at a time.
 * @param jobId - Galaxy job id to record, or null to drop the parameter.
 */
function syncJobParam(jobId: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (jobId) {
    url.searchParams.set("job", jobId);
  } else {
    url.searchParams.delete("job");
  }
  window.history.replaceState(null, "", url);
}

/**
 * Drives a Logan/kmindex sequence search: lists the available indexes, submits
 * a FASTA query, polls the resulting Galaxy job, and pages through the merged
 * hits once it completes.
 * @returns Search state and actions.
 */
export const useKmindexSearch = (): KmindexSearchActions &
  KmindexSearchState => {
  const [state, setState] = useState<KmindexSearchState>(INITIAL_STATE);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  // A poll tick already in flight when the job completes can fire a second
  // first-page fetch. Cold aggregation is expensive, so make sure only one
  // wins per job.
  const fetchedRef = useRef<string | null>(null);

  const stopPolling = useCallback((): void => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    ky.get(`${API_BASE_URL}/galaxy/kmindex/indexes`, { timeout: 120000 })
      .json<{ count: number; indexes: string[] }>()
      .then(({ indexes }) => {
        if (!cancelled)
          setState((prev) => ({ ...prev, indexes, isLoadingIndexes: false }));
      })
      .catch(async (error: unknown) => {
        const message = await toErrorMessage(error, "Failed to load indexes");
        if (!cancelled)
          setState((prev) => ({
            ...prev,
            error: message,
            isLoadingIndexes: false,
          }));
      });

    return (): void => {
      cancelled = true;
    };
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const fetchResults = useCallback(
    async (jobId: string, offset: number): Promise<void> => {
      setState((prev) => ({ ...prev, isLoadingResults: true }));
      try {
        const results = await ky
          .get(`${API_BASE_URL}/galaxy/kmindex/jobs/${jobId}/results`, {
            searchParams: { limit: PAGE_SIZE, offset },
            // Cold aggregation pulls every shard from Galaxy; the warm path
            // returns from cache in milliseconds.
            timeout: 300000,
          })
          .json<KmindexResults>();
        setState((prev) => ({ ...prev, isLoadingResults: false, results }));
      } catch (error: unknown) {
        const message = await toErrorMessage(error, "Failed to load results");
        setState((prev) => ({
          ...prev,
          error: message,
          isLoadingResults: false,
        }));
      }
    },
    []
  );

  const startPolling = useCallback(
    (jobId: string): void => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const status = await ky
            .get(`${API_BASE_URL}/galaxy/jobs/${jobId}/status`, {
              timeout: 30000,
            })
            .json<KmindexJobStatus>();
          setState((prev) => ({ ...prev, jobStatus: status }));

          if (status.is_complete) {
            stopPolling();
            if (status.is_successful) {
              if (fetchedRef.current === jobId) return;
              fetchedRef.current = jobId;
              await fetchResults(jobId, 0);
            } else {
              setState((prev) => ({
                ...prev,
                error: `Job ${status.state}${
                  status.stderr ? `: ${status.stderr.slice(0, 500)}` : ""
                }`,
              }));
            }
          }
        } catch (error: unknown) {
          const message = await toErrorMessage(error, "Lost track of the job");
          setState((prev) => ({ ...prev, error: message }));
        }
      }, POLLING_INTERVAL);
    },
    [fetchResults, stopPolling]
  );

  // Reattach to a job named in the URL (?job=<galaxy job id>). A search can
  // outlive its page by a long way -- Vista queues have run past 40 minutes --
  // so the job id needs to be shareable and survive a reload. Polling handles
  // both cases: still running, or finished and ready to page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const jobId = new URLSearchParams(window.location.search).get("job");
    if (!jobId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- react-hooks v7 anti-pattern (setState in effect)
    setState((prev) => ({ ...prev, jobId }));
    startPolling(jobId);
    // Mount only -- re-running this would restart polling on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only reattach
  }, []);

  const submit = useCallback(
    async (submission: KmindexSubmission): Promise<void> => {
      stopPolling();
      fetchedRef.current = null;
      setState((prev) => ({
        ...prev,
        error: null,
        isSubmitting: true,
        jobId: null,
        jobStatus: null,
        results: null,
      }));

      try {
        const { job_id } = await ky
          .post(`${API_BASE_URL}/galaxy/kmindex/submit`, {
            json: submission,
            timeout: 120000,
          })
          .json<{ job_id: string }>();

        setState((prev) => ({ ...prev, isSubmitting: false, jobId: job_id }));
        syncJobParam(job_id);
        startPolling(job_id);
      } catch (error: unknown) {
        const message = await toErrorMessage(error, "Failed to submit query");
        setState((prev) => ({ ...prev, error: message, isSubmitting: false }));
      }
    },
    [startPolling, stopPolling]
  );

  const goToPage = useCallback(
    async (offset: number): Promise<void> => {
      if (!state.jobId) return;
      await fetchResults(state.jobId, offset);
    },
    [fetchResults, state.jobId]
  );

  const reset = useCallback((): void => {
    stopPolling();
    fetchedRef.current = null;
    syncJobParam(null);
    setState((prev) => ({
      ...INITIAL_STATE,
      indexes: prev.indexes,
      isLoadingIndexes: false,
    }));
  }, [stopPolling]);

  return { ...state, goToPage, reset, submit };
};
