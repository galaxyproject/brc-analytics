import { type JSX } from "react";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { StyledGrid, StyledTitle } from "./priorityPathogensView.styles";
import { type Props } from "./types";
import { sortPriorityPathogen } from "./utils";

export const PriorityPathogensView = (props: Props): JSX.Element => {
  // Get priority pathogens data.
  const { data } = props;
  const { hits } = data;

  // Sort priority pathogens (copy first — avoid mutating props-derived data).
  const priorityPathogens = [...hits].sort(sortPriorityPathogen);

  return (
    <StyledGrid>
      <StyledTitle />
      <PriorityPathogens priorityPathogens={priorityPathogens} />
    </StyledGrid>
  );
};
