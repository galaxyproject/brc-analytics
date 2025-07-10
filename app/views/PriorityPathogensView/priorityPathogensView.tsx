import { Props } from "./types";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { sortPriorityPathogen } from "./utils";
import { StyledGrid, StyledTitle } from "./priorityPathogensView.styles";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";

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
