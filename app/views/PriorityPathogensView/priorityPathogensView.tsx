import { Props } from "./types";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { HeroLayout } from "@databiosphere/findable-ui/lib/components/Index/components/Hero/hero.styles";
import { Title } from "@databiosphere/findable-ui/lib/components/common/Title/title";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";
import { sortPriorityPathogen } from "./utils";
import { StyledIndex } from "./priorityPathogensView.styles";

export const PriorityPathogensView = (props: Props): JSX.Element => {
  const { entityConfig } = useConfig();
  const { dimensions } = useLayoutDimensions();

  // Get priority pathogens data.
  const { data } = props;
  const { hits } = data;

  // Sort priority pathogens.
  const priorityPathogens = hits.sort(sortPriorityPathogen);

  return (
    <StyledIndex marginTop={dimensions.header.height}>
      <HeroLayout>
        <Title title={entityConfig.explorerTitle} />
      </HeroLayout>
      <PriorityPathogens priorityPathogens={priorityPathogens} />
    </StyledIndex>
  );
};
