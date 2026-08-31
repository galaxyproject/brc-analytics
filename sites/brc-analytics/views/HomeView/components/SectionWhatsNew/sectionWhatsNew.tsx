import { SectionTitle } from "@repo/shared/views/HomeView/components/Section/section.styles";
import { type JSX } from "react";
import { Arrow } from "./components/Arrow/arrow";
import { ARROW_DIRECTION } from "./components/Arrow/types";
import { Cards } from "./components/Cards/cards";
import { WHATS_NEW_CARDS } from "./constants";
import { useCardPaging } from "./hooks/UseCardPaging/hook";
import {
  Arrows,
  CardsRow,
  CardsViewport,
  Headline,
  StyledSection,
} from "./sectionWhatsNew.styles";

export const SectionWhatsNew = (): JSX.Element => {
  const {
    canPageBack,
    canPageForward,
    offset,
    onFocusCard,
    onPageBack,
    onPageForward,
    swipeProps,
    viewportRef,
  } = useCardPaging(WHATS_NEW_CARDS.length);
  return (
    <StyledSection>
      <Headline>
        <SectionTitle>What&apos;s New</SectionTitle>
        <Arrows>
          <Arrow
            direction={ARROW_DIRECTION.BACK}
            disabled={!canPageBack}
            onClick={onPageBack}
          />
          <Arrow
            direction={ARROW_DIRECTION.FORWARD}
            disabled={!canPageForward}
            onClick={onPageForward}
          />
        </Arrows>
      </Headline>
      <CardsViewport ref={viewportRef} {...swipeProps}>
        <CardsRow offset={offset} onFocusCapture={onFocusCard}>
          <Cards cards={WHATS_NEW_CARDS} />
        </CardsRow>
      </CardsViewport>
    </StyledSection>
  );
};
