import { Props } from "./types";
import { useLayoutSpacing } from "@databiosphere/findable-ui/lib/hooks/UseLayoutSpacing/hook";
import { Title } from "@databiosphere/findable-ui/lib/components/Index/components/EntityControls/components/Title/title";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { sortPriorityPathogen } from "./utils";
import { StyledGrid } from "./priorityPathogensView.styles";

export const PriorityPathogensView = (props: Props): JSX.Element => {
  const { spacing } = useLayoutSpacing();

  // Get priority pathogens data.
  const { data } = props;
  const { hits } = data;

  // Sort priority pathogens.
  const priorityPathogens = hits.sort(sortPriorityPathogen);

  return (
    <StyledGrid {...spacing}>
      <Title />
      <PriorityPathogens priorityPathogens={priorityPathogens} />
    </StyledGrid>
  );
};
