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
    setState((prev) => ({
      ...INITIAL_STATE,
      indexes: prev.indexes,
      isLoadingIndexes: false,
    }));
  }, [stopPolling]);

  return { ...state, goToPage, reset, submit };
};
