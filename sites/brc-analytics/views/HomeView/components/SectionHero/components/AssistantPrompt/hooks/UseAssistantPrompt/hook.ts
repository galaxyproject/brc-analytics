import { getPayload } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Form/utils";
import { KEY } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/constants";
import { handleEnterKey } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/utils";
import { useRouter } from "next/router";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";
import type { UseAssistantPrompt } from "./types";
import { getAssistantHref, getAssistantUrl, getInputValue } from "./utils";

/**
 * Opens the assistant with the submitted question, and tracks whether there is
 * a question to submit at all.
 * @returns Whether the field is empty, and the form's event handlers.
 */
export const useAssistantPrompt = (): UseAssistantPrompt => {
  const router = useRouter();
  const [isEmpty, setIsEmpty] = useState(true);

  const onInput = useCallback((event: FormEvent<HTMLFormElement>): void => {
    setIsEmpty(!getInputValue(event.currentTarget));
  }, []);

  // Replaces the input's own key handling, which is built for the assistant
  // page: there, Escape clears the field and Tab fills it with the placeholder,
  // both by setting state directly. Neither fires an input event, so emptiness
  // would go stale, and hijacking Tab would trap focus in the field. Only
  // Enter-to-submit is kept.
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      // An Enter that commits an IME candidate is not a submit: the question is
      // still being composed, and sending it here would ask the assistant the
      // text as it stood before conversion.
      if (event.key !== KEY.ENTER || event.nativeEvent.isComposing) return;
      handleEnterKey(event);
    },
    []
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const { query } = getPayload(event);
      if (!query) return;
      // The submit is already prevented, so a client-side navigation that
      // rejects -- a chunk that won't load, most likely -- would leave the
      // question on a page that looks like it did nothing. Ask for the page
      // itself instead.
      router.push(getAssistantUrl(query)).catch(() => {
        window.location.assign(getAssistantHref(query));
      });
    },
    [router]
  );

  return { isEmpty, onInput, onKeyDown, onSubmit };
};
