import {
  getBorderBoxSizeHeight,
  useResizeObserver,
} from "@databiosphere/findable-ui/lib/hooks/useResizeObserver";
import { useRef } from "react";
import type { UseFooterClearance } from "./types";
import { getFooterClearanceStyle } from "./utils";

/**
 * Measures the footer, so that whatever the chat column brings into view, such
 * as a link or suggestion focused from the keyboard, is kept clear of it where
 * it is pinned to the column's foot, on wider screens. Follows the footer as it
 * grows or shrinks with an error or a longer draft; the conversation's styles
 * apply the clearance.
 * @returns Ref for the footer, and the conversation's clearance style.
 */
export const useFooterClearance = (): UseFooterClearance => {
  const ref = useRef<HTMLDivElement>(null);
  // Once findable-ui releases useLayoutHeight (Layout/hooks/UseLayoutHeight, on
  // its main branch) and this app upgrades, switch to it: it writes the
  // measured height to a custom property without re-rendering.
  const { height } = useResizeObserver(ref, getBorderBoxSizeHeight) ?? {};
  return { ref, style: getFooterClearanceStyle(height) };
};
