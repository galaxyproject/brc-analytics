/**
 * Scrolls the conversation's end, the composer, into view at the bottom of
 * whichever scrolls it. A no-op while the conversation is hidden.
 * @param element - Conversation element.
 */
export function revealEnd(element: HTMLElement | null): void {
  element?.scrollIntoView({ block: "end" });
}
