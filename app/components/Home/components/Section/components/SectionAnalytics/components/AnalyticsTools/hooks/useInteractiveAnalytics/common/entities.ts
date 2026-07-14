import { UseSwipeInteraction } from "@/hooks/useSwipeInteraction/useSwipeInteraction";
import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";

export interface UseInteractiveAnalytics {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: DXCardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
}
