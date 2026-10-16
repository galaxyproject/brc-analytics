import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import type { KeyboardInputEvent } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseKeyShortCuts/types";
import type { ChangeEvent, FormEvent } from "react";

export interface UseComposer {
  canSend: boolean;
  onChange: (event: ChangeEvent<InputElement>) => void;
  onKeyDown: (event: KeyboardInputEvent) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  value: string;
}
