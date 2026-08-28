import { getPayload } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Form/utils";
import { KEY } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/constants";
import { useRouter } from "next/router";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";
import type { UseAssistantPrompt } from "./types";
import { getAssistantUrl, getInputValue } from "./utils";

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
      if (event.key !== KEY.ENTER || event.shiftKey) return;
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    },
    []
  );

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const { query } = getPayload(event);
      if (!query) return;
      router.push(getAssistantUrl(query));
    },
    [router]
  );

  return { isEmpty, onInput, onKeyDown, onSubmit };
};
