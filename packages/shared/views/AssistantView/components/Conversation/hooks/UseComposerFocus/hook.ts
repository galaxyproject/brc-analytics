import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import { useCallback, useRef } from "react";
import type { UseComposerFocus } from "./types";

/**
 * Holds the ref to the composer's field, so controls outside the composer can
 * move focus to it.
 * @returns Ref for the composer's field, and a handler that focuses it.
 */
export const useComposerFocus = (): UseComposerFocus => {
  const inputRef = useRef<InputElement>(null);

  const onFocusComposer = useCallback((): void => {
    inputRef.current?.focus();
  }, []);

  return { inputRef, onFocusComposer };
};
