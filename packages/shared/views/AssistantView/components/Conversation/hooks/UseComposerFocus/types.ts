import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import type { RefObject } from "react";

export interface UseComposerFocus {
  inputRef: RefObject<InputElement | null>;
  onFocusComposer: () => void;
}
