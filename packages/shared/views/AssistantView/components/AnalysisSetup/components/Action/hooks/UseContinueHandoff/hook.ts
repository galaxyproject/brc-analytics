import { normalizePagePath } from "@repo/shared/hooks/UseCurrentPath/utils";
import { ENTITY_KEYS } from "@repo/shared/providers/workflowHandoff/constants";
import {
  extractAccessions,
  resolveSequencingSource,
} from "@repo/shared/providers/workflowHandoff/dataSource";
import { useHandoffDispatch } from "@repo/shared/providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import type { AnalysisSchema } from "@repo/shared/services/api-client/types";
import Router from "next/router";
import { useCallback } from "react";
import type { UseContinueHandoff } from "./types";

/**
 * Returns the handler behind the panel's "Continue to workflow setup" button:
 * records the sequencing inputs the assistant captured against the setup page,
 * then navigates there. Does nothing until the assistant has produced a
 * handoff URL.
 * @param handoffUrl - Workflow setup URL from the assistant, or null while incomplete.
 * @param schema - Current analysis schema.
 * @returns Continue handler.
 */
export const useContinueHandoff = (
  handoffUrl: string | null,
  schema: AnalysisSchema | null
): UseContinueHandoff => {
  const { onSetHandoff } = useHandoffDispatch();

  const onContinue = useCallback((): void => {
    if (!handoffUrl || !schema) return;
    onSetHandoff({
      entity: ENTITY_KEYS.ASSEMBLIES,
      inputs: {
        accessions: extractAccessions(schema.data_source),
        sequencingSource: resolveSequencingSource(schema.data_source),
      },
      // Normalise so the dispatch key matches the read site (useCurrentPath)
      // regardless of trailing slash / query / fragment from the backend.
      path: normalizePagePath(handoffUrl),
    });
    // Singleton Router.push (not useRouter) — SPA nav, no reactive value to
    // track in deps. A full-page nav (window.location.href) would tear down
    // the WorkflowInputsView provider before the consumer reads dispatched
    // state.
    Router.push(handoffUrl);
  }, [handoffUrl, onSetHandoff, schema]);

  return { onContinue };
};
