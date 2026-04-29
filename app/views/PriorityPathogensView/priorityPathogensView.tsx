import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { JSX } from "react";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { StyledGrid, StyledTitle } from "./priorityPathogensView.styles";
import { Props } from "./types";
import { sortPriorityPathogen } from "./utils";

export const PriorityPathogensView = (props: Props): JSX.Element => {
  const { spacing } = useLayoutSpacing();

  // Get priority pathogens data.
  const { data } = props;
  const { hits } = data;

  // Sort priority pathogens.
  const priorityPathogens = hits.sort(sortPriorityPathogen);

  return (
    <StyledGrid {...spacing}>
      <StyledTitle />
      <PriorityPathogens priorityPathogens={priorityPathogens} />
    </StyledGrid>
  );
};
