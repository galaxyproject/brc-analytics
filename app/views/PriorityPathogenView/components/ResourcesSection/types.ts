import { SectionProps } from "../../../../components/Entity/components/Section/types";
import { OutbreakResource } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
