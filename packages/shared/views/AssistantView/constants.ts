/**
 * Placeholder for any field that asks the assistant a question, wherever it is
 * rendered: the wording should not change between where a question is typed
 * and where it is answered.
 *
 * Its rendered width is load-bearing: a field sized to hold this on one line is
 * measured against this wording, so changing its length can wrap it. Re-measure
 * the fields that render it before settling on new copy.
 */
export const ASSISTANT_INPUT_PLACEHOLDER =
  "Ask about organisms, analyses, or workflows...";

/**
 * Query parameters read by an assistant page.
 * QUESTION carries a question asked elsewhere on the site, sent as the first
 * message of a new conversation; SESSION_ID names a conversation to restore;
 * LOGAN_JOB names a finished Logan search to open a session against, and
 * outranks SESSION_ID when both are present.
 */
export const ASSISTANT_QUERY_PARAM = {
  LOGAN_JOB: "loganJob",
  QUESTION: "q",
  SESSION_ID: "sessionId",
} as const;
