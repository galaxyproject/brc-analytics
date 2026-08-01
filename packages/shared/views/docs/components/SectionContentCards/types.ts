import type { SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import type { ComponentProps } from "react";

export interface Props {
  cards?: ComponentProps<typeof SectionContentCard>[];
}
