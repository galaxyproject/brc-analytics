import { OutbreakResource } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { SectionProps } from "@brc-analytics/core/components/Entity/components/Section/types";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
