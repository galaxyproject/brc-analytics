import { JSX } from "react";
import { Props } from "./types";
import { StyledStack } from "./sectionContentCards.styles";
import { SectionContentCard } from "../../../common/Card/components/SectionContentCard/sectionContentCard";

export const SectionContentCards = ({ cards }: Props): JSX.Element | null => {
  if (!cards) return null;
  return (
    <StyledStack>
      {cards.map(({ href, secondaryText, title }) => (
        <SectionContentCard
          key={href}
          cardUrl={href}
          secondaryText={secondaryText}
          title={title}
        />
      ))}
    </StyledStack>
  );
};
