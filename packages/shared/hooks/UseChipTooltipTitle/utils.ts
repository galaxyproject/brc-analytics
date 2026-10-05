/**
 * Whether a chip label is truncated by its ellipsis.
 * @param el - The chip's `.MuiChip-label` element.
 * @returns True when the label's content is wider than the label.
 */
export function isLabelOverflowed(el: HTMLElement): boolean {
  return el.offsetWidth < el.scrollWidth;
}
