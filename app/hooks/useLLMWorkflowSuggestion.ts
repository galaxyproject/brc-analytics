import { useCallback, useState } from "react";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { llmAPIClient } from "../services/llm-api-client";
import {
  WorkflowSuggestionRequest,
  WorkflowSuggestionResponse,
} from "../types/api";

interface SubmitOptions {
  onError: (error: Error) => void;
  onSuccess: () => void;
}

interface UseLLMWorkflowSuggestionReturn {
  data: WorkflowSuggestionResponse | undefined;
  status: {
    errors: Record<string, string>;
    loading: boolean;
  };
  suggest: (request: WorkflowSuggestionRequest) => Promise<void>;
}

/**
 * Fetch workflow suggestions using LLM analysis
 * @param root0 - The suggestion parameters
 * @param root0.request - The workflow suggestion request details
 * @param root0.submitOptions - Options for handling submit success/error
 * @returns Promise that resolves when suggestion completes
 */
async function suggestWorkflow({
  request,
  submitOptions,
}: {
  request: WorkflowSuggestionRequest;
  submitOptions: SubmitOptions;
}): Promise<WorkflowSuggestionResponse | undefined> {
  try {
    const result = await llmAPIClient.suggestWorkflow(request);
    submitOptions.onSuccess();
    return result;
  } catch (error) {
    submitOptions.onError(error as Error);
    return undefined;
  }
}

/**
 * Custom hook for workflow suggestions using LLM analysis
 * Follows existing useAsync pattern from @databiosphere/findable-ui
 * @returns Object with data, suggest function, and status
 */
export const useLLMWorkflowSuggestion = (): UseLLMWorkflowSuggestionReturn => {
  const { data, run } = useAsync<WorkflowSuggestionResponse | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const suggest = useCallback(
    async (request: WorkflowSuggestionRequest): Promise<void> => {
      if (!request.dataset_description.trim()) {
        setErrors({
          dataset_description: "Dataset description cannot be empty",
        });
        return;
      }

      if (!request.analysis_goal.trim()) {
        setErrors({ analysis_goal: "Analysis goal cannot be empty" });
        return;
      }

      setLoading(true);
      setErrors({});

      run(
        suggestWorkflow({
          request,
          submitOptions: {
            onError: (e) => {
              const errorMessage = handleSuggestionError(e);
              setErrors({ suggestion: errorMessage });
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

  return { data, status: { errors, loading }, suggest };
};

/**
 * Handle different types of API errors and provide user-friendly messages
 * @param error - Error from API call
 * @returns User-friendly error message
 */
function handleSuggestionError(error: unknown): string {
  const err = error as { message?: string; name?: string };
  if (err.name === "TimeoutError") {
    return "Workflow suggestion timed out. Please try again.";
  } else if (err.message?.includes("503")) {
    return "AI service temporarily unavailable. Please select workflow manually.";
  } else if (err.message?.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  } else if (err.message?.includes("500")) {
    return "Internal server error. Please try again later.";
  } else {
    return "Workflow suggestion failed. Please try again or select workflow manually.";
  }
}
