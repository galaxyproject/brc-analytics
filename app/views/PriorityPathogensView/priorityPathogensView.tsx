import type { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import { getEntities } from "@/services/workflows/query";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { JSX } from "react";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { StyledGrid, StyledTitle } from "./priorityPathogensView.styles";
import { sortPriorityPathogen } from "./utils";

const ENTITY_LIST_TYPE = "priority-pathogens";

export const PriorityPathogensView = (): JSX.Element => {
  const { spacing } = useLayoutSpacing();

  const priorityPathogens = [...getEntities<Outbreak>(ENTITY_LIST_TYPE)].sort(
    sortPriorityPathogen
  );

  return (
    <StyledGrid {...spacing}>
      <StyledTitle />
      <PriorityPathogens priorityPathogens={priorityPathogens} />
    </StyledGrid>
  );
};
