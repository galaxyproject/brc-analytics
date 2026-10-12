import { MESSAGE_ROLE } from "@repo/shared/views/AssistantView/constants";

export const ARIA_LABEL = {
  MESSAGES: "Conversation",
} as const;

/**
 * Who sent a message, read out by screen readers before it.
 */
export const SENDER_LABEL = {
  [MESSAGE_ROLE.ASSISTANT]: "Assistant:",
  [MESSAGE_ROLE.USER]: "You:",
} as const;

export const STATUS_LABEL = {
  LOADING: "Thinking...",
  RESTORING: "Restoring conversation...",
} as const;
