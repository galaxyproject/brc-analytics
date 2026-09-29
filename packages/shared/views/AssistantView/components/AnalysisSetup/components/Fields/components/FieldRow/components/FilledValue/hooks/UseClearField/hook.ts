import { FIELD_LABELS } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/constants";
import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import { type KeyboardEvent, useCallback } from "react";
import type { UseClearField } from "./types";
import { getClearFieldMessage, isActivationKey } from "./utils";

/**
 * Returns the handlers behind a field chip's ×. Clearing is sent as a message
 * rather than a dedicated call, so the assistant sees the change and re-asks.
 * The chip is announced as a remove control, so Enter and Space clear it from
 * the keyboard as well as Backspace and Delete; a pointer only clears from
 * the ×. Does nothing while a reply is in flight: the chip is disabled then,
 * but a focused chip still receives key presses.
 * @param fieldKey - Schema field key.
 * @param loading - Whether a reply to the last message is in flight.
 * @param onSend - Sends a message to the assistant.
 * @returns Clear and key-down handlers.
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

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (!isActivationKey(event.key)) return;
      event.preventDefault();
      onClear();
    },
    [onClear]
  );

  return { onClear, onKeyDown };
};
