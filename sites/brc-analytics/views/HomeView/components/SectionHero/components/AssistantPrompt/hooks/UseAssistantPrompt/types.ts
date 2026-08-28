import type { FormEvent, KeyboardEvent } from "react";

export interface UseAssistantPrompt {
  isEmpty: boolean;
  onInput: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}
