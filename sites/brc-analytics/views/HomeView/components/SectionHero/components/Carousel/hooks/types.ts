import { type CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { type UseSwipeInteraction } from "@repo/shared/views/HomeView/hooks/UseSwipeInteraction/types";

export interface UseInteractiveCarousel {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: CardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
  onSetSwipeAction: UseSwipeInteraction["onSetSwipeAction"];
}
