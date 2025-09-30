import ky, { HTTPError } from "ky";
import {
  DatasetSearchRequest,
  DatasetSearchResponse,
  WorkflowSuggestionRequest,
  WorkflowSuggestionResponse,
} from "../types/api";

const apiClient = ky.create({
  hooks: {
    beforeError: [
      (error): HTTPError => {
        const { response } = error;
        if (response && response.body) {
          error.name = "APIError";
          error.message = `${response.status}: ${response.statusText}`;
        }
        return error;
      },
    ],
  },
  prefixUrl:
    process.env.NODE_ENV === "development"
      ? "http://localhost/api/v1"
      : "/api/v1",
  retry: {
    limit: 2,
    methods: ["get", "post"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: 30000,
});

export const llmAPIClient = {
  /**
   * Check health status of LLM service
   * @returns Promise resolving to health status
   */
  checkLLMHealth: async (): Promise<{
    llm_available: boolean;
    status: string;
  }> => {
    return apiClient.get("llm/health").json();
  },

  /**
   * Get cache statistics for monitoring
   * @returns Promise resolving to cache statistics
   */
  getCacheStats: async (): Promise<{
    hit_rate: number;
    keys_count: number;
    memory_usage: number;
  }> => {
    return apiClient.get("cache/stats").json();
  },

  /**
   * Search datasets using natural language query
   * @param request - Dataset search parameters
   * @returns Promise resolving to search results with ENA data
   */
  searchDatasets: async (
    request: DatasetSearchRequest
  ): Promise<DatasetSearchResponse> => {
    return apiClient.post("llm/dataset-search", { json: request }).json();
  },

  /**
   * Get workflow suggestions based on dataset characteristics
   * @param request - Workflow suggestion parameters
   * @returns Promise resolving to recommended workflows
   */
  suggestWorkflow: async (
    request: WorkflowSuggestionRequest
  ): Promise<WorkflowSuggestionResponse> => {
    return apiClient.post("llm/workflow-suggest", { json: request }).json();
  },
};
