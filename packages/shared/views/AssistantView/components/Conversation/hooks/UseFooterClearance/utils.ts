import {
  FOOTER_CLEARANCE_PROPERTY,
  GAP,
} from "@repo/shared/views/AssistantView/components/Conversation/constants";
import type { CSSProperties } from "react";

/**
 * Builds the conversation's style that keeps whatever is brought into view
 * clear of the pinned footer: its height and the gap it paints over.
 * @param height - Footer's height, in pixels, or undefined until it is measured.
 * @returns Conversation style, or undefined until the footer is measured.
 */
export function getFooterClearanceStyle(
  height: number | undefined
): CSSProperties | undefined {
  if (height === undefined) return;
  // A custom property, which React's style type doesn't list.
  return { [FOOTER_CLEARANCE_PROPERTY]: `${height + GAP}px` } as CSSProperties;
}
