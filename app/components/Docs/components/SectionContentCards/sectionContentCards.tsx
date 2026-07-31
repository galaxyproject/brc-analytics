import { SectionContentCard } from "@/components/common/Card/components/SectionContentCard/sectionContentCard";
import { type Props } from "@repo/shared/views/docs/components/SectionContentCards/types";
import { type JSX } from "react";
import { StyledStack } from "./sectionContentCards.styles";

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
