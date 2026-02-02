import ky, { HTTPError } from "ky";
import { API_BASE_URL } from "../config/api";
import {
  DatasetSearchRequest,
  DatasetSearchResponse,
  UnifiedSearchRequest,
  UnifiedSearchResponse,
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
  prefixUrl: API_BASE_URL,
  retry: {
    limit: 2,
    methods: ["get", "post"],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: 90000,
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

  /**
   * Unified search that intelligently returns both datasets and workflow suggestions
   * @param request - Unified search parameters
   * @returns Promise resolving to datasets and/or workflow recommendations
   */
  unifiedSearch: async (
    request: UnifiedSearchRequest
  ): Promise<UnifiedSearchResponse> => {
    return apiClient.post("llm/unified-search", { json: request }).json();
  },
};
