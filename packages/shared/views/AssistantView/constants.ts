/**
 * Query parameters read by an assistant page.
 * QUESTION carries a question asked elsewhere on the site, sent as the first
 * message of a new conversation; SESSION_ID names a conversation to restore.
 */
export const ASSISTANT_QUERY_PARAM = {
  QUESTION: "q",
  SESSION_ID: "sessionId",
} as const;
