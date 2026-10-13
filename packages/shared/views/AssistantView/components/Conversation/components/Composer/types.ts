import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import type { ConversationProps } from "@repo/shared/views/AssistantView/components/Conversation/types";
import type { RefObject } from "react";

export interface ComposerProps extends Pick<ConversationProps, "onSend"> {
  disabled: boolean;
  hasMessages: boolean;
  inputRef: RefObject<InputElement | null>;
}
