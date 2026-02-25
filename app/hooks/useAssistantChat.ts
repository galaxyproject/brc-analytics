import { useCallback, useRef, useState } from "react";
import { llmAPIClient } from "../services/llm-api-client";
import {
  AnalysisSchema,
  AssistantChatResponse,
  SuggestionChip,
} from "../types/api";

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface UseAssistantChatReturn {
  error: string | null;
  handoffUrl: string | null;
  isComplete: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  schema: AnalysisSchema | null;
  sendMessage: (message: string) => Promise<void>;
  suggestions: SuggestionChip[];
}

/**
 * Manages assistant chat state: messages, session, schema, and suggestions.
 * @returns Chat state and a sendMessage function
 */
export const useAssistantChat = (): UseAssistantChatReturn => {
  const [messages, setMessages] = useState<ChatMessageDisplay[]>([]);
  const [schema, setSchema] = useState<AnalysisSchema | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately for responsiveness
    setMessages((prev) => [...prev, { content: message, role: "user" }]);

    try {
      const response: AssistantChatResponse = await llmAPIClient.assistantChat({
        message,
        session_id: sessionIdRef.current ?? undefined,
      });

      sessionIdRef.current = response.session_id;

      // Add assistant reply
      setMessages((prev) => [
        ...prev,
        { content: response.reply, role: "assistant" },
      ]);

      setSchema(response.schema_state);
      setSuggestions(response.suggestions);
      setIsComplete(response.is_complete);
      setHandoffUrl(response.handoff_url);
    } catch (err) {
      const errorMessage = handleChatError(err);
      setError(errorMessage);
      // Remove the user message if the request failed entirely
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    error,
    handoffUrl,
    isComplete,
    loading,
    messages,
    schema,
    sendMessage,
    suggestions,
  };
};

/**
 * Map API errors to user-friendly messages.
 * @param error - The caught error
 * @returns A user-facing error string
 */
function handleChatError(error: unknown): string {
  const err = error as { message?: string; name?: string };
  if (err.name === "TimeoutError") {
    return "The assistant took too long to respond. Please try again.";
  } else if (err.message?.includes("503")) {
    return "The analysis assistant is currently unavailable. Please try again later.";
  } else if (err.message?.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}
