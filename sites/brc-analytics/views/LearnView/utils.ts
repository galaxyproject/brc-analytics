import type { SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import type { ComponentProps } from "react";
import { CARDS } from "./constants";

/**
 * Filters the cards based on the provided feature flags.
 * @param isLmlsEnabled - A boolean indicating if the LMLS feature is enabled.
 * @returns An array of filtered cards based on the feature flags.
 */
export function getFilteredCards(
  isLmlsEnabled: boolean
): ComponentProps<typeof SectionContentCard>[] {
  return CARDS.filter(
    (card) => card.href !== "/learn/sequence-search-workflows" || isLmlsEnabled
  );
}
