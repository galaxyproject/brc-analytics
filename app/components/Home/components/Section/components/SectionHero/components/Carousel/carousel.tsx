import { JSX } from "react";
import { SWIPE_ACTION } from "../../../../../../../../hooks/useSwipeInteraction/common/entities";
import {
  Carousel as CarouselCards,
  CarouselView,
  StyledBullets,
} from "./carousel.styles";
import { Arrow } from "./components/Arrow/arrow";
import { Cards } from "./components/Cards/cards";
import { useInteractiveCarousel } from "./hooks/useInteractiveCarousel";

export const Carousel = (): JSX.Element => {
  const {
    activeIndex,
    interactiveAction,
    interactiveCards,
    interactiveIndexes,
    onSetActiveIndex,
    onSetSwipeAction,
  } = useInteractiveCarousel();
  return (
    <CarouselView>
      <CarouselCards {...interactiveAction}>
        <Arrow
          onClick={(): void => onSetSwipeAction(SWIPE_ACTION.SWIPE_BACKWARD)}
          swipeAction={SWIPE_ACTION.SWIPE_BACKWARD}
        />
        <Cards activeIndex={activeIndex} cards={interactiveCards} />
        <Arrow
          onClick={(): void => onSetSwipeAction(SWIPE_ACTION.SWIPE_FORWARD)}
          swipeAction={SWIPE_ACTION.SWIPE_FORWARD}
        />
        <StyledBullets
          activeBullet={activeIndex}
          bullets={interactiveIndexes}
          onBullet={onSetActiveIndex}
        />
      </CarouselCards>
    </CarouselView>
  );
};
