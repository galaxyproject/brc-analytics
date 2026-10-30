import { ROUTES } from "@repo/shared/routes/constants";
import { apiClient } from "@repo/shared/services/api-client/api-client";
import type { AssistantInfoResponse } from "@repo/shared/services/api-client/types";
import { ASSISTANT_QUERY_PARAM } from "@repo/shared/views/AssistantView/constants";
import Router from "next/router";
import type { OpenSavedAnalysisOptions } from "./types";

/**
 * Builds the model label shown in the disclaimer from the assistant's /info
 * response, falling back to a generic label until it loads.
 * @param info - Assistant info response, or null while loading or on failure.
 * @returns Model label.
 */
export function formatModelLabel(info: AssistantInfoResponse | null): string {
  if (info === null) return "powered by AI";
  if (!info.available) return "model not available";
  const parts: string[] = [];
  if (info.provider) parts.push(info.provider);
  if (info.model) parts.push(info.model);
  return parts.length > 0 ? `powered by ${parts.join(" / ")}` : "powered by AI";
}

/**
 * Builds the conversation-logging notice shown in the disclaimer.
 * @param info - Assistant info response, or null while loading or on failure.
 * @returns Retention notice, or an empty string when there is no retention window.
 */
export function formatRetentionNotice(
  info: AssistantInfoResponse | null
): string {
  // Served by /info rather than hardcoded: the window is configurable and the
  // sweep can be off, and a stale privacy promise is worse than a vague one.
  const days = info?.turn_log_retention_days;
  // Explicit rather than `!days`: a negative window is a misconfiguration the
  // backend refuses to sweep, and must not render as "deleted after -1 days".
  if (days == null || days < 1) return "";
  return ` During the beta, conversations are logged so we can improve the assistant, then deleted after ${days} days.`;
}

/**
 * Opens a saved conversation in the assistant: the backend restores it into a
 * live session, and the assistant page restores that session from the URL.
 * @param id - Saved conversation id.
 * @param options - Navigation options.
 * @param options.replace - Replace the current history entry rather than push
 * one. For opening from the assistant page itself: the session cookie vouches
 * for one conversation at a time, so an entry for the one being left could not
 * be restored by Back.
 * @returns The live session the conversation was restored into, or null when
 * a later navigation cancelled this one -- the page never reached it.
 */
export async function openSavedAnalysis(
  id: string,
  { replace = false }: OpenSavedAnalysisOptions = {}
): Promise<string | null> {
  const { session_id } = await apiClient.openSavedAnalysis(id);
  const url = {
    pathname: ROUTES.ASSISTANT,
    query: { [ASSISTANT_QUERY_PARAM.SESSION_ID]: session_id },
  };
  // Singleton Router (not useRouter): callers need not thread one through.
  // A replace stays on the assistant page, where only the query changes, so
  // it is shallow; a push arrives from another page and loads this one.
  const navigated = await (replace
    ? Router.replace(url, undefined, { shallow: true })
    : Router.push(url));
  return navigated ? session_id : null;
}
