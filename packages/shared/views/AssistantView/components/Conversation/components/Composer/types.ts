import type { InputElement } from "@databiosphere/findable-ui/lib/views/ResearchView/assistant/components/Input/hooks/UseControlledInput/types";
import type { UseAssistantChatActions } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/types";
import type { RefObject } from "react";

export interface ComposerProps {
  disabled: boolean;
  hasMessages: boolean;
  inputRef: RefObject<InputElement | null>;
  onSend: UseAssistantChatActions["onSendMessage"];
}
