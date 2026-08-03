import { type CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { type UseSwipeInteraction } from "@repo/shared/views/HomeView/hooks/UseSwipeInteraction/types";

export interface UseInteractiveAnalyticsAndData {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: DXCardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
}
