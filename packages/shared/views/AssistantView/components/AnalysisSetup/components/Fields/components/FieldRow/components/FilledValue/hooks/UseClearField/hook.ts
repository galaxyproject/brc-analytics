import { isClearableField } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/utils";
import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import { type KeyboardEvent, useCallback } from "react";
import type { UseClearField } from "./types";
import { isActivationKey } from "./utils";

/**
 * Returns the handlers behind a field chip's ×. Clearing is a direct call
 * rather than a chat message, so it can't depend on how the assistant reads
 * the wording; the assistant is told about it on the next turn. The chip is
 * announced as a remove control, so Enter and Space clear it from the keyboard
 * as well as Backspace and Delete; a pointer only clears from the ×. Does
 * nothing while a reply is in flight: the chip is disabled then, but a focused
 * chip still receives key presses.
 * @param fieldKey - Schema field key.
 * @param loading - Whether a reply to the last message is in flight.
 * @param onClearField - Clears a field without asking the assistant.
 * @returns Clear and key-down handlers.
 */
export const useClearField = (
  fieldKey: SchemaFieldKey,
  loading: boolean,
  onClearField: AnalysisSetupProps["onClearField"]
): UseClearField => {
  const onClear = useCallback((): void => {
    if (loading || !isClearableField(fieldKey)) return;
    void onClearField(fieldKey);
  }, [fieldKey, loading, onClearField]);

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
