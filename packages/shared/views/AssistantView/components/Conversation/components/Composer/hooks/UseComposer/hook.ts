import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import type { ComposerProps } from "@repo/shared/views/AssistantView/components/Conversation/components/Composer/types";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import type { UseComposer } from "./types";
import { canSendMessage, onComposerKeyDown } from "./utils";

/**
 * Holds the composer's text and sends it, trimmed, when its form is submitted,
 * then clears it and returns focus to the field, since the send button it may
 * have been sent from is disabled once the field is empty. Enter submits the
 * form; Shift+Enter starts a new line. Does nothing while the assistant is
 * busy or the composer holds only whitespace.
 * @param onSend - Sends a message to the assistant.
 * @param disabled - Whether the assistant is busy, so nothing can be sent.
 * @returns Composer value, whether it can be sent, and its handlers.
 */
export const useComposer = (
  onSend: ComposerProps["onSend"],
  disabled: boolean
): UseComposer => {
  const inputRef = useRef<InputElement>(null);
  const [value, setValue] = useState("");
  const canSend = canSendMessage(value, disabled);

  const onChange = useCallback((event: ChangeEvent<InputElement>): void => {
    setValue(event.target.value);
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      if (!canSend) return;
      onSend(value.trim());
      setValue("");
      inputRef.current?.focus();
    },
    [canSend, onSend, value]
  );

  return {
    canSend,
    inputRef,
    onChange,
    onKeyDown: onComposerKeyDown,
    onSubmit,
    value,
  };
};
