import { CardAction as DXCardAction } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardAction/cardAction";
import { CardSecondaryText as DXCardSecondaryText } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardSecondaryText/cardSecondaryText";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CardMedia } from "@repo/shared/views/HomeView/components/Card/components/CardMedia/cardMedia";
import { type JSX, useRef } from "react";
import {
  CardContent,
  CardSection,
  CardTitle,
  StyledBullets,
  StyledCard,
  StyledCardActions,
  StyledGrid,
} from "./analyticsTools.styles";
import { useInteractiveAnalytics } from "./hooks/UseInteractiveAnalytics/hook";
import { type Props } from "./types";

export const AnalyticsTools = ({ cards }: Props): JSX.Element => {
  const toolsRef = useRef<HTMLDivElement>(null);
  const {
    activeIndex,
    interactionEnabled,
    interactiveAction,
    interactiveCards,
    interactiveIndexes,
    onSetActiveIndex,
  } = useInteractiveAnalytics(toolsRef, cards);
  return (
    <div>
      <StyledGrid
        ref={toolsRef}
        interactionEnabled={interactionEnabled}
        {...interactiveAction}
      >
        {interactiveCards.map(({ cardActions, media, text, title }, i) => (
          <StyledCard key={i} component={RoundedPaper}>
            <CardSection>
              {media && <CardMedia media={media} />}
              <CardContent>
                <CardTitle>{title}</CardTitle>
                <DXCardSecondaryText>{text}</DXCardSecondaryText>
              </CardContent>
              {cardActions && (
                <StyledCardActions>
                  {cardActions?.map(({ label, target, url }) => (
                    <DXCardAction
                      key={url}
                      label={label}
                      target={target}
                      url={url}
                    />
                  ))}
                </StyledCardActions>
              )}
            </CardSection>
          </StyledCard>
        ))}
      </StyledGrid>
      <StyledBullets
        activeBullet={activeIndex}
        bullets={interactiveIndexes}
        interactionEnabled={interactionEnabled}
        onBullet={onSetActiveIndex}
      />
    </div>
  );
};
