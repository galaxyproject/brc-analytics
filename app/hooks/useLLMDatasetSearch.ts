import { useCallback, useState } from "react";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { llmAPIClient } from "../services/llm-api-client";
import { DatasetSearchResponse } from "../types/api";

interface SubmitOptions {
  onError: (error: Error) => void;
  onSuccess: () => void;
}

interface UseLLMDatasetSearchReturn {
  data: DatasetSearchResponse | undefined;
  search: (query: string) => Promise<void>;
  status: {
    errors: Record<string, string>;
    loading: boolean;
  };
}

/**
 * Fetch dataset search results using LLM interpretation
 * @param root0 - The search parameters
 * @param root0.query - The natural language search query
 * @param root0.submitOptions - Options for handling submit success/error
 * @returns Promise that resolves when search completes
 */
async function searchDatasets({
  query,
  submitOptions,
}: {
  query: string;
  submitOptions: SubmitOptions;
}): Promise<DatasetSearchResponse | undefined> {
  try {
    const result = await llmAPIClient.searchDatasets({
      include_metadata: true,
      max_results: 50,
      query,
    });
    submitOptions.onSuccess();
    return result;
  } catch (error) {
    submitOptions.onError(error as Error);
    return undefined;
  }
}

/**
 * Custom hook for natural language dataset search using LLM interpretation
 * Follows existing useAsync pattern from @databiosphere/findable-ui
 * @returns Object with data, search function, and status
 */
export const useLLMDatasetSearch = (): UseLLMDatasetSearchReturn => {
  const { data, run } = useAsync<DatasetSearchResponse | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const search = useCallback(
    async (query: string): Promise<void> => {
      if (!query.trim()) {
        setErrors({ query: "Search query cannot be empty" });
        return;
      }

      setLoading(true);
      setErrors({});

      run(
        searchDatasets({
          query,
          submitOptions: {
            onError: (e) => {
              const errorMessage = handleSearchError(e);
              setErrors({ search: errorMessage });
              setLoading(false);
            },
            onSuccess: () => {
              setLoading(false);
            },
          },
        })
      );
    },
    [run]
  );

  return { data, search, status: { errors, loading } };
};

/**
 * Handle different types of API errors and provide user-friendly messages
 * @param error - Error from API call
 * @returns User-friendly error message
 */
function handleSearchError(error: unknown): string {
  const err = error as { message?: string; name?: string };
  if (err.name === "TimeoutError") {
    return "Search timed out. Please try again.";
  } else if (err.message?.includes("400")) {
    // Check for low confidence / invalid query error
    if (
      err.message?.includes("confidence") ||
      err.message?.includes("specific")
    ) {
      return "Your query couldn't be interpreted. Try providing more specific bioinformatics terms (organism name, experiment type, etc.).";
    }
    return "Invalid search query. Please provide more details.";
  } else if (err.message?.includes("503")) {
    return "AI service temporarily unavailable. Please try the traditional search.";
  } else if (err.message?.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  } else if (err.message?.includes("500")) {
    return "Internal server error. Please try again later.";
  } else {
    return "Search failed. Please check your query and try again.";
  }
}
