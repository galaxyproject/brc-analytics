import { FIELD_LABELS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/constants";
import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import { useCallback } from "react";
import type { UseClearField } from "./types";
import { getClearFieldMessage } from "./utils";

/**
 * Returns the handler behind a field chip's ×. Clearing is sent as a message
 * rather than a dedicated call, so the assistant sees the change and re-asks.
 * Does nothing while a reply is in flight: the chip is disabled then, but a
 * focused chip still fires its delete on Backspace/Delete.
 * @param fieldKey - Schema field key.
 * @param loading - Whether a reply to the last message is in flight.
 * @param onSend - Sends a message to the assistant.
 * @returns Clear handler.
 */
export const useClearField = (
  fieldKey: SchemaFieldKey,
  loading: boolean,
  onSend: AnalysisSetupProps["onSend"]
): UseClearField => {
  const onClear = useCallback((): void => {
    if (loading) return;
    void onSend(getClearFieldMessage(FIELD_LABELS[fieldKey]));
  }, [fieldKey, loading, onSend]);
  return { onClear };
};
