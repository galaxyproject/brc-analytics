import { API_BASE_URL } from "@repo/shared/config/api";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantInfoResponse,
  LoganSessionRequest,
  SessionRestoreResponse,
} from "@repo/shared/services/api-client/types";
import ky, { type HTTPError } from "ky";

const httpClient = ky.create({
  // Send the assistant session-binding cookie cross-origin. Without
  // this, ky inherits fetch's "same-origin" default and the browser
  // strips the cookie when NEXT_PUBLIC_BACKEND_URL points off-origin
  // (which is the deployed shape) -- silently breaking session
  // restore/delete. Backend already sets CORS allow_credentials=True.
  credentials: "include",
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

export const assistantAPIClient = {
  /**
   * Send a message to the analysis assistant
   * @param request - Chat message and optional session ID
   * @returns Promise resolving to assistant reply with schema state
   */
  assistantChat: async (
    request: AssistantChatRequest
  ): Promise<AssistantChatResponse> => {
    return httpClient
      .post("assistant/chat", {
        json: request,
        retry: { limit: 0 },
        timeout: 120000,
      })
      .json();
  },

  /**
   * Open a new assistant session bound to a finished Logan search.
   * @param request - The Logan job id.
   * @returns Promise resolving to the new session (intro, schema, suggestions).
   */
  assistantCreateSession: async (
    request: LoganSessionRequest
  ): Promise<SessionRestoreResponse> => {
    // One attempt: a 404/409 is an answer, not a blip, and the caller links
    // the user back to the results page either way.
    return httpClient
      .post("assistant/session", { json: request, retry: { limit: 0 } })
      .json();
  },

  /**
   * Delete an assistant session
   * @param sessionId - Session to delete
   */
  assistantDeleteSession: async (sessionId: string): Promise<void> => {
    await httpClient.delete(`assistant/session/${sessionId}`);
  },

  /**
   * Get assistant configuration info (model, provider, availability) for UI attribution.
   * @returns Promise resolving to assistant info
   */
  assistantInfo: async (): Promise<AssistantInfoResponse> => {
    return httpClient.get("assistant/info").json();
  },

  /**
   * Restore a previous assistant session
   * @param sessionId - Session to restore
   * @returns Promise resolving to session state (messages, schema, suggestions)
   */
  assistantRestore: async (
    sessionId: string
  ): Promise<SessionRestoreResponse> => {
    // One attempt only. A Redis outage now surfaces as 500, which is in the
    // shared retry list, so the default would spend three tries plus any
    // Retry-After the proxy asks for -- all with a person watching a spinner.
    // Failing fast is fine here: the pointer is kept and a reload retries.
    return httpClient
      .get(`assistant/session/${sessionId}`, { retry: { limit: 0 } })
      .json();
  },
};
