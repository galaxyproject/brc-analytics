/**
 * Scrolls the page so the conversation's end, the composer, is in view at the
 * bottom. A no-op while the conversation is hidden.
 * @param element - Conversation element.
 */
export function revealEnd(element: HTMLElement | null): void {
  element?.scrollIntoView({ block: "end" });
}
