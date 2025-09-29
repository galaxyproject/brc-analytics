import { CardProps as DXCardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { UseSwipeInteraction } from "../../../../../../../../../../../../hooks/useSwipeInteraction/useSwipeInteraction";

export interface UseInteractiveAnalyticsAndData {
  activeIndex: UseSwipeInteraction["activeIndex"];
  interactionEnabled: boolean;
  interactiveAction?: UseSwipeInteraction["interactiveAction"];
  interactiveCards: DXCardProps[];
  interactiveIndexes: number[];
  onSetActiveIndex: UseSwipeInteraction["onSetActiveIndex"];
}
