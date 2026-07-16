import { UseSwipeInteraction } from "@brc-analytics/core/hooks/UseSwipeInteraction/types";
import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export interface UseInteractiveAnalyticsAndData {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: DXCardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
}
