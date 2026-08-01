import { SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import { type JSX } from "react";
import { StyledStack } from "./sectionContentCards.styles";
import type { Props } from "./types";

export const SectionContentCards = ({ cards }: Props): JSX.Element | null => {
  if (!cards) return null;
  return (
    <StyledStack>
      {cards.map((card, i) => (
        <SectionContentCard key={card.href ?? i} {...card} />
      ))}
    </StyledStack>
  );
};
