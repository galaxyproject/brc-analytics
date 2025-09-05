import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Fragment } from "react";
import { getCardPosition } from "../../common/utils";
import { Card, CardContent, CardPositioner, CardSection } from "./cards.styles";

export interface CardsProps {
  activeIndex: number;
  cards: CardProps[];
}

export const Cards = ({ activeIndex, cards }: CardsProps): JSX.Element => {
  const lastIndex = cards.length - 1;
  return (
    <Fragment>
      {cards.map(({ text }, c) => {
        return (
          <CardPositioner
            key={c}
            cardPosition={getCardPosition(c, activeIndex, lastIndex)}
          >
            <Card component={RoundedPaper}>
              <CardSection>
                <CardContent>{text}</CardContent>
              </CardSection>
            </Card>
          </CardPositioner>
        );
      })}
    </Fragment>
  );
};
