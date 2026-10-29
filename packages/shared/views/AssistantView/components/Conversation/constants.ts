/**
 * Custom property, set on the HTML element, holding the measured height of the
 * footer pinned beneath the conversation. Named apart from the page footer's
 * `--footer-height`.
 */
export const FOOTER_HEIGHT_PROPERTY = "--conversation-footer-height";

/**
 * Space, in pixels, between the conversation's parts. The pinned footer paints
 * over the same space above it, so content scrolled behind it stays clear of it.
 */
export const GAP = 16;
