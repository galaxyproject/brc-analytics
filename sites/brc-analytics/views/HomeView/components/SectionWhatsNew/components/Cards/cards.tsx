import { CardAction } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardAction/cardAction";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/RoundedPaper/roundedPaper";
import { CardActions } from "@mui/material";
import { type JSX } from "react";
import { StyledCard } from "./cards.styles";
import { CARD_INDEX_ATTRIBUTE } from "./constants";
import { type Props } from "./types";

export const Cards = ({ cards }: Props): JSX.Element[] => {
  return cards.map(({ cardActions, text }, i) => (
    <StyledCard
      component={RoundedPaper}
      key={i}
      {...{ [CARD_INDEX_ATTRIBUTE]: i }}
    >
      {text}
      {cardActions && cardActions.length > 0 && (
        <CardActions disableSpacing>
          {cardActions.map((cardAction, j) => (
            <CardAction key={`${cardAction.url}-${j}`} {...cardAction} />
          ))}
        </CardActions>
      )}
    </StyledCard>
  ));
};
