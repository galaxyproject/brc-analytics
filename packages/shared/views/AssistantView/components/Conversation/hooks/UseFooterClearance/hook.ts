import { useLayoutHeight } from "@databiosphere/findable-ui/lib/components/Layout/hooks/UseLayoutHeight/hook";
import type { UseLayoutHeight } from "@databiosphere/findable-ui/lib/components/Layout/hooks/UseLayoutHeight/types";
import { FOOTER_HEIGHT_PROPERTY } from "@repo/shared/views/AssistantView/components/Conversation/constants";

/**
 * Measures the footer, so that whatever the chat column brings into view, such
 * as a link or suggestion focused from the keyboard, is kept clear of it where
 * it is pinned to the column's foot, on wider screens. Follows the footer as it
 * grows or shrinks with an error or a longer draft, writing its height to a
 * custom property without re-rendering; the conversation's styles apply the
 * clearance.
 * @returns Ref for the footer, and whether it has been measured.
 */
export const useFooterClearance = (): UseLayoutHeight<HTMLDivElement> =>
  useLayoutHeight<HTMLDivElement>(FOOTER_HEIGHT_PROPERTY);
