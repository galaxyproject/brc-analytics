import type { SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import type { ComponentProps } from "react";

/**
 * A Learn card, plus whether it is one of the cards the demo feature flag
 * gates. Declared on the card itself so gated content is named where the
 * content is, rather than re-identified by URL in the filter.
 */
export type LearnCard = ComponentProps<typeof SectionContentCard> & {
  isDemoGated?: boolean;
};
