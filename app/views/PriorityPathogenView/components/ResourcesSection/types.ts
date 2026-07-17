import { OutbreakResource } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { SectionProps } from "@/views/PriorityPathogenView/ui/Section/types";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
