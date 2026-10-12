import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";
import { REPLY_PLACEHOLDER } from "./constants";

/**
 * Returns the composer placeholder. An empty conversation asks the question
 * the same way the rest of the site does; after that, the user is replying.
 * @param hasMessages - Whether the conversation has any messages.
 * @returns Placeholder text.
 */
export function getPlaceholder(hasMessages: boolean): string {
  return hasMessages ? REPLY_PLACEHOLDER : ASSISTANT_INPUT_PLACEHOLDER;
}
