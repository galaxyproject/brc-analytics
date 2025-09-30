import { useState, useCallback, useEffect } from "react";
import ky from "ky";

// Types based on our backend models
interface GalaxyJobSubmission {
  filename?: string;
  num_random_lines: number;
  tabular_data: string;
}

interface GalaxyJobResponse {
  job_id: string;
  message: string;
  status: string;
  upload_dataset_id: string;
}

interface GalaxyJobOutput {
  dataset: {
    file_ext: string;
    file_size?: number;
    id: string;
    name: string;
    state: string;
  };
  id: string;
  name: string;
}

interface GalaxyJobStatus {
  created_time: string;
  exit_code?: number;
  is_complete: boolean;
  is_successful: boolean;
  job_id: string;
  outputs: GalaxyJobOutput[];
  state: string;
  stderr?: string;
  stdout?: string;
  updated_time: string;
}

interface GalaxyJobResult {
  completed_time?: string;
  created_time: string;
  job_id: string;
  outputs: GalaxyJobOutput[];
  processing_time?: string;
  results: Record<string, string>;
  status: string;
}

// Job history item for localStorage
interface GalaxyJobHistoryItem {
  completed_time?: string;
  created_time: string;
  filename?: string;
  job_id: string;
  num_random_lines: number;
  results?: Record<string, string>;
  status: string;
  tabular_data: string;
  updated_time?: string;
}

// Hook state interface
interface GalaxyJobState {
  // Results retrieval state
  isLoadingResults: boolean;
  // Polling state
  isPolling: boolean;
  // Submission state
  isSubmitting: boolean;

  // Job tracking state
  jobHistory: GalaxyJobHistoryItem[];
  jobId: string | null;
  jobResults: GalaxyJobResult | null;
  jobStatus: GalaxyJobStatus | null;

  // Error states
  pollingError: string | null;
  resultsError: string | null;
  submissionError: string | null;
}

interface GalaxyJobActions {
  clearJobHistory: () => void;
  getResults: (jobId: string) => Promise<void>;
  reset: () => void;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  submitJob: (submission: GalaxyJobSubmission) => Promise<void>;
}

const BACKEND_URL = "http://localhost:8000";
const POLLING_INTERVAL = 2000; // 2 seconds
const STORAGE_KEY = "galaxy_job_history";

// localStorage utilities
const loadJobHistory = (): GalaxyJobHistoryItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error: unknown) {
    console.error("Failed to load job history from localStorage:", error);
    return [];
  }
};

const saveJobHistory = (history: GalaxyJobHistoryItem[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error: unknown) {
    console.error("Failed to save job history to localStorage:", error);
  }
};

const addJobToHistory = (job: GalaxyJobHistoryItem): void => {
  const history = loadJobHistory();
  // Add new job at the beginning (most recent first)
  const updatedHistory = [
    job,
    ...history.filter((h) => h.job_id !== job.job_id),
  ];
  // Keep only the most recent 50 jobs
  const trimmedHistory = updatedHistory.slice(0, 50);
  saveJobHistory(trimmedHistory);
};

const updateJobInHistory = (
  jobId: string,
  updates: Partial<GalaxyJobHistoryItem>
): void => {
  console.log(`📝 Updating job ${jobId} in history with:`, updates);
  const history = loadJobHistory();
  const updatedHistory = history.map((job) =>
    job.job_id === jobId ? { ...job, ...updates } : job
  );
  saveJobHistory(updatedHistory);
  console.log(`✅ Job ${jobId} updated in history`);
};

export const useGalaxyJob = (): GalaxyJobState & GalaxyJobActions => {
  const [state, setState] = useState<GalaxyJobState>(() => ({
    isLoadingResults: false,
    isPolling: false,
    isSubmitting: false,
    jobHistory: [],
    jobId: null,
    jobResults: null,
    jobStatus: null,
    pollingError: null,
    resultsError: null,
    submissionError: null,
  }));

  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);

  // Load job history on mount (client-side only)
  useEffect((): void => {
    if (typeof window !== "undefined") {
      const history = loadJobHistory();
      setState((prev) => ({ ...prev, jobHistory: history }));
    }
  }, []);

  // Submit job to Galaxy
  const submitJob = useCallback(
    async (submission: GalaxyJobSubmission): Promise<void> => {
      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        jobId: null,
        jobResults: null,
        jobStatus: null,
        submissionError: null,
      }));

      try {
        const response = await ky
          .post(`${BACKEND_URL}/api/v1/galaxy/submit-job`, {
            json: submission,
            timeout: 60000, // 60 seconds
          })
          .json<GalaxyJobResponse>();

        // Create job history item
        const historyItem: GalaxyJobHistoryItem = {
          created_time: new Date().toISOString(),
          filename: submission.filename,
          job_id: response.job_id,
          num_random_lines: submission.num_random_lines,
          status: "submitted",
          tabular_data: submission.tabular_data,
        };

        // Save to localStorage
        addJobToHistory(historyItem);

        // Update state with new job and refresh history
        const updatedHistory = loadJobHistory();
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          jobHistory: updatedHistory,
          jobId: response.job_id,
        }));

        // Will start polling via useEffect when jobId changes
      } catch (error: unknown) {
        let errorMessage = "Failed to submit job";
        if (error && typeof error === "object" && "response" in error) {
          const httpError = error as {
            response: {
              json: () => Promise<{ detail?: string }>;
              status: number;
              statusText: string;
            };
          };
          try {
            const errorData = await httpError.response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {
            errorMessage = `HTTP ${httpError.response.status}: ${httpError.response.statusText}`;
          }
        } else if (error && typeof error === "object" && "message" in error) {
          errorMessage = (error as Error).message || errorMessage;
        }

        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submissionError: errorMessage,
        }));
      }
    },
    []
  );

  // Get job status
  const getJobStatus = useCallback(
    async (jobId: string): Promise<GalaxyJobStatus | null> => {
      try {
        const response = await ky
          .get(`${BACKEND_URL}/api/v1/galaxy/jobs/${jobId}/status`, {
            timeout: 30000,
          })
          .json<GalaxyJobStatus>();

        return response;
      } catch (error: unknown) {
        console.error("Failed to get job status:", error);
        return null;
      }
    },
    []
  );

  // Get job results
  const getResults = useCallback(async (jobId: string): Promise<void> => {
    console.log(`🔍 Getting results for job ${jobId}`);
    setState((prev) => ({
      ...prev,
      isLoadingResults: true,
      resultsError: null,
    }));

    try {
      const response = await ky
        .get(`${BACKEND_URL}/api/v1/galaxy/jobs/${jobId}/results`, {
          timeout: 30000,
        })
        .json<GalaxyJobResult>();

      console.log(`✅ Got results for job ${jobId}:`, response);

      setState((prev) => ({
        ...prev,
        isLoadingResults: false,
        jobResults: response,
      }));

      // Save results to localStorage
      console.log(`💾 Saving results to localStorage for job ${jobId}`);
      updateJobInHistory(jobId, {
        completed_time: response.completed_time,
        results: response.results,
        status: response.status,
      });
      console.log(`✅ Results saved to localStorage for job ${jobId}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to get results";
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response: {
            json: () => Promise<{ detail?: string }>;
            status: number;
            statusText: string;
          };
        };
        try {
          const errorData = await httpError.response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = `HTTP ${httpError.response.status}: ${httpError.response.statusText}`;
        }
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as Error).message || errorMessage;
      }

      setState((prev) => ({
        ...prev,
        isLoadingResults: false,
        resultsError: errorMessage,
      }));
    }
  }, []);

  // Start polling job status
  const startPolling = useCallback(
    (jobId: string): void => {
      // Clear any existing polling
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }

      setState((prev) => ({
        ...prev,
        isPolling: true,
        pollingError: null,
      }));

      // Poll immediately
      getJobStatus(jobId).then((status) => {
        if (status) {
          setState((prev) => ({ ...prev, jobStatus: status }));

          // Update job status in history
          updateJobInHistory(jobId, {
            status: status.state,
            updated_time: status.updated_time,
          });

          // If job is complete, stop polling and get results
          if (status.is_complete) {
            console.log(
              `🏁 Job ${jobId} completed with status: ${status.state}, successful: ${status.is_successful}`
            );
            // Stop polling inline
            if (pollingIntervalId) {
              clearInterval(pollingIntervalId);
              setPollingIntervalId(null);
            }
            setState((prev) => ({ ...prev, isPolling: false }));

            if (status.is_successful) {
              console.log(
                `🚀 Job ${jobId} was successful, fetching results...`
              );
              // Get results for completed successful jobs
              getResults(jobId);
            } else {
              console.log(
                `❌ Job ${jobId} was not successful, skipping results fetch`
              );
            }
          }
        }
      });

      // Set up interval polling
      const intervalId = setInterval(async () => {
        const status = await getJobStatus(jobId);
        if (status) {
          setState((prev) => ({ ...prev, jobStatus: status }));

          // Update job status in history
          updateJobInHistory(jobId, {
            status: status.state,
            updated_time: status.updated_time,
          });

          // If job is complete, stop polling and get results
          if (status.is_complete) {
            console.log(
              `🏁 Job ${jobId} completed in polling loop with status: ${status.state}, successful: ${status.is_successful}`
            );
            // Stop polling inline
            clearInterval(intervalId);
            setPollingIntervalId(null);
            setState((prev) => ({ ...prev, isPolling: false }));

            if (status.is_successful) {
              console.log(
                `🚀 Job ${jobId} was successful in polling loop, fetching results...`
              );
              // Get results for completed successful jobs
              getResults(jobId);
            } else {
              console.log(
                `❌ Job ${jobId} was not successful in polling loop, skipping results fetch`
              );
            }
          }
        } else {
          setState((prev) => ({
            ...prev,
            pollingError: "Failed to get job status",
          }));
        }
      }, POLLING_INTERVAL);

      setPollingIntervalId(intervalId);
    },
    [pollingIntervalId, getJobStatus, getResults]
  );

  // Stop polling
  const stopPolling = useCallback((): void => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setState((prev) => ({
      ...prev,
      isPolling: false,
    }));
  }, [pollingIntervalId]);

  // Clear job history
  const clearJobHistory = useCallback((): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState((prev) => ({ ...prev, jobHistory: [] }));
  }, []);

  // Reset all state
  const reset = useCallback((): void => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }

    const currentHistory = loadJobHistory();
    setState({
      isLoadingResults: false,
      isPolling: false,
      isSubmitting: false,
      jobHistory: currentHistory,
      jobId: null,
      jobResults: null,
      jobStatus: null,
      pollingError: null,
      resultsError: null,
      submissionError: null,
    });
  }, [pollingIntervalId]);

  // Auto-start polling when a new job is submitted
  useEffect((): void => {
    if (state.jobId && !state.isPolling && !state.jobResults) {
      startPolling(state.jobId);
    }
  }, [state.jobId, state.isPolling, state.jobResults, startPolling]);

  // Cleanup on unmount
  useEffect((): (() => void) => {
    return (): void => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  return {
    // State
    ...state,

    // Actions
    clearJobHistory,
    getResults,
    reset,
    startPolling,
    stopPolling,
    submitJob,
  };
};
