import { JSX } from "react";
import { SectionContentCard } from "../../../common/Card/components/SectionContentCard/sectionContentCard";
import { StyledStack } from "./sectionContentCards.styles";
import { Props } from "./types";

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
