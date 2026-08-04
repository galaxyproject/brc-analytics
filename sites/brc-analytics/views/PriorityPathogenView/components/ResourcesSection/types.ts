import type { OutbreakResource } from "@brc/apis/types";
import type { SectionProps } from "@brc/views/PriorityPathogenView/ui/Section/types";

export interface Props extends Omit<SectionProps, "children"> {
  resources: OutbreakResource[];
}
