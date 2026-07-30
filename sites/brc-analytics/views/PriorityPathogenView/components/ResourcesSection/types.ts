import type { OutbreakResource } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { SectionProps } from "@/components/Entity/components/Section/types";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
