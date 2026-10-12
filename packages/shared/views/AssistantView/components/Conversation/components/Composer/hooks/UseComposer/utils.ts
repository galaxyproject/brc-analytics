import { KEY } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/constants";
import type { KeyboardInputEvent } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/types";
import { handleEnterKey } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/utils";
import { IME_PROCESSING_KEY_CODE } from "./constants";

/**
 * Whether a message can be sent: the assistant is not busy and the composer
 * holds more than whitespace.
 * @param value - Composer text.
 * @param disabled - Whether the assistant is busy.
 * @returns True when the message can be sent.
 */
export function canSendMessage(value: string, disabled: boolean): boolean {
  return !disabled && value.trim() !== "";
}

/**
 * Submits the composer's form on Enter; Shift+Enter starts a new line. Enter
 * that confirms an IME composition is left to the IME: Safari reports it with
 * the IME processing key code rather than `isComposing`.
 * @param event - Keyboard event.
 */
export function onComposerKeyDown(event: KeyboardInputEvent): void {
  if (event.key !== KEY.ENTER) return;
  if (event.nativeEvent.isComposing) return;
  if (event.nativeEvent.keyCode === IME_PROCESSING_KEY_CODE) return;
  handleEnterKey(event);
}
