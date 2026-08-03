import type { OutbreakResource } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { SectionProps } from "@brc/views/PriorityPathogenView/ui/Section/types";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
