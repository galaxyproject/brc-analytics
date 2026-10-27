import { FOOTER_CLEARANCE_PROPERTY } from "@repo/shared/views/AssistantView/components/Conversation/constants";

/**
 * Sets the space that whatever is brought into view in the conversation keeps
 * clear of the pinned footer.
 * @param conversation - Conversation element.
 * @param clearance - Space to keep clear, in pixels, or null to clear it.
 */
export function setFooterClearance(
  conversation: HTMLElement,
  clearance: number | null
): void {
  if (clearance === null) {
    conversation.style.removeProperty(FOOTER_CLEARANCE_PROPERTY);
    return;
  }
  conversation.style.setProperty(FOOTER_CLEARANCE_PROPERTY, `${clearance}px`);
}
