import { Props } from "./types";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { Index } from "@databiosphere/findable-ui/lib/components/Index/index.styles";
import { HeroLayout } from "@databiosphere/findable-ui/lib/components/Index/components/Hero/hero.styles";
import { Title } from "@databiosphere/findable-ui/lib/components/common/Title/title";
import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { PriorityPathogens } from "./components/PriorityPathogens/priorityPathogens";

export const PriorityPathogensView = (props: Props): JSX.Element => {
  const { entityConfig } = useConfig();
  const { dimensions } = useLayoutDimensions();
  const { data } = props;
  const { hits } = data;
  return (
    <Index marginTop={dimensions.header.height}>
      <HeroLayout>
        <Title title={entityConfig.explorerTitle} />
      </HeroLayout>
      <PriorityPathogens priorityPathogens={hits} />
    </Index>
  );
};
