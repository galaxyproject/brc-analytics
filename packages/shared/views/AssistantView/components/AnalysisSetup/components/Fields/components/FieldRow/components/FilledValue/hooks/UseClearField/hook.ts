import { isClearableField } from "@repo/shared/views/AssistantView/components/AnalysisSetup/components/Fields/components/FieldRow/components/FilledValue/utils";
import type {
  AnalysisSetupProps,
  SchemaFieldKey,
} from "@repo/shared/views/AssistantView/components/AnalysisSetup/types";
import { type KeyboardEvent, type SyntheticEvent, useCallback } from "react";
import type { UseClearField } from "./types";
import { isActivationKey, isKeyboardEvent } from "./utils";

/**
 * Returns the handlers behind a field chip's ×. The clear goes to the server
 * as structured data on a chat turn rather than as a message, so it can't
 * depend on how the assistant reads the wording, and the assistant still
 * replies to it. The chip is announced as a remove control, so Enter and
 * Space clear it from the keyboard as well as Backspace and Delete; a pointer
 * only clears from the ×. Does nothing while a reply is in flight: the chip is
 * disabled then, but a focused chip still receives key presses.
 * A keyboard clear moves focus off the chip first: the chip is disabled while
 * the reply is in flight and then unmounts, either of which would drop focus to
 * the page. A pointer clear leaves focus where it is.
 * @param fieldKey - Schema field key.
 * @param loading - Whether a reply to the last message is in flight.
 * @param onClearField - Clears a field without asking the assistant.
 * @param onKeyboardClear - Moves focus off the chip after a keyboard clear.
 * @returns Clear and key-down handlers.
 */
export const useClearField = (
  fieldKey: SchemaFieldKey,
  loading: boolean,
  onClearField: AnalysisSetupProps["onClearField"],
  onKeyboardClear: () => void
): UseClearField => {
  const onClear = useCallback(
    (event: SyntheticEvent): void => {
      if (loading || !isClearableField(fieldKey)) return;
      if (isKeyboardEvent(event)) onKeyboardClear();
      void onClearField(fieldKey);
    },
    [fieldKey, loading, onClearField, onKeyboardClear]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (!isActivationKey(event.key)) return;
      event.preventDefault();
      onClear(event);
    },
    [onClear]
  );

  return { onClear, onKeyDown };
};
