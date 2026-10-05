import type { InputProps } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/types";
import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";

export const INPUT_PROPS: InputProps = {
  // Autofocus is on by default, which on a landing page pulls focus -- and the
  // viewport -- to the input before the reader has seen the headline.
  autoFocus: false,
  placeholder: ASSISTANT_INPUT_PLACEHOLDER,
};
