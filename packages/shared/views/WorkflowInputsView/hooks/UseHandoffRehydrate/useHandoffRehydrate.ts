import { useCurrentPath } from "@repo/shared/hooks/UseCurrentPath/hook";
import { SEQUENCING_SOURCE } from "@repo/shared/providers/workflowHandoff/constants";
import {
  extractAccessions,
  resolveSequencingSource,
} from "@repo/shared/providers/workflowHandoff/dataSource";
import { useHandoffDispatch } from "@repo/shared/providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import { useHandoffInputs } from "@repo/shared/providers/workflowHandoff/hooks/UseHandoffInputs/hook";
import { type EntityKey } from "@repo/shared/providers/workflowHandoff/types";
import { assistantAPIClient } from "@repo/shared/services/assistant-api-client";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

/**
 * Restore the assistant handoff for this entity+path from the session id the
 * handoff URL carries.
 *
 * The in-app handoff dispatches into the provider and then `Router.push`es, so
 * the inputs only exist in memory. Anyone who reloads the stepper, bookmarks
 * the URL, or is sent the link lands on an empty data step with no error —
 * `assistantSessionId` was already in the query string but only ever read for
 * telemetry. This reads it back.
 *
 * ENA only. An upload handoff has nothing recoverable — the files were never
 * ours — and its initial input is captured synchronously at mount by
 * `useAssistantHandoff`, which an async restore has already missed.
 * @param entity - Entity key (e.g. `assemblies`).
 */
export const useHandoffRehydrate = (entity: EntityKey): void => {
  const { query } = useRouter();
  const path = useCurrentPath();
  const { onSetHandoff } = useHandoffDispatch();
  const { accessions } = useHandoffInputs(entity, path);
  // `useHandoffSync` clears the cell as soon as it consumes one, which then
  // looks identical to "never had one". A ref of what we already applied is
  // what stops the restore running again; re-enabling the query costs nothing
  // because `staleTime: Infinity` serves it from cache without a refetch.
  const appliedRef = useRef<string | null>(null);

  const sessionId =
    typeof query.assistantSessionId === "string"
      ? query.assistantSessionId
      : null;

  // Only a cold arrival needs this: a session id in the URL and nothing in the
  // provider. On the in-app path the dispatch precedes the push, so the cell is
  // already populated by the time this mounts and no fetch happens.
  const enabled = Boolean(sessionId) && accessions.length === 0;

  const { data } = useReactQuery({
    enabled,
    queryFn: () => assistantAPIClient.assistantRestore(sessionId as string),
    queryKey: ["AssistantHandoffRehydrate", sessionId],
    // A 403 (someone else's session cookie) or 404 (expired) is an answer, not
    // a blip, and there is nothing to show the user either way.
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!enabled || !data || !sessionId) return;
    const key = `${sessionId}|${path}`;
    if (appliedRef.current === key) return;
    appliedRef.current = key;
    const field = data.schema_state?.data_source;
    if (!field) return;
    if (resolveSequencingSource(field) !== SEQUENCING_SOURCE.ENA) return;
    const accessions = extractAccessions(field);
    if (accessions.length === 0) return;
    onSetHandoff({
      entity,
      inputs: { accessions, sequencingSource: SEQUENCING_SOURCE.ENA },
      path,
    });
  }, [data, enabled, entity, onSetHandoff, path, sessionId]);
};
