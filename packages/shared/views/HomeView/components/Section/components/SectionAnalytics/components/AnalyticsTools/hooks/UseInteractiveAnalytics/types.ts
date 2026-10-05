import { type AnalyticsCard } from "@repo/shared/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/types";
import { type UseSwipeInteraction } from "@repo/shared/views/HomeView/hooks/UseSwipeInteraction/types";

export interface UseInteractiveAnalytics {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: AnalyticsCard[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
}
