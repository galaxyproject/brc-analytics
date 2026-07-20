import { CardMedia } from "@brc-analytics/core/views/HomeView/components/Card/components/CardMedia/cardMedia";
import { useInteractiveAnalytics } from "@brc-analytics/core/views/HomeView/components/Section/components/SectionAnalytics/components/AnalyticsTools/hooks/UseInteractiveAnalytics/hook";
import { CardAction as DXCardAction } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardAction/cardAction";
import { CardSecondaryText as DXCardSecondaryText } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardSecondaryText/cardSecondaryText";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { JSX, useRef } from "react";
import {
  CardContent,
  CardSection,
  CardTitle,
  Grid,
  StyledBullets,
  StyledCard,
  StyledCardActions,
} from "./analyticsTools.styles";
import { ANALYTICS_TOOLS } from "./common/constants";

export const AnalyticsTools = (): JSX.Element => {
  const toolsRef = useRef<HTMLDivElement>(null);
  const {
    activeIndex,
    interactionEnabled,
    interactiveAction,
    interactiveCards,
    interactiveIndexes,
    onSetActiveIndex,
  } = useInteractiveAnalytics(toolsRef, ANALYTICS_TOOLS);
  return (
    <div>
      <Grid
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
      </Grid>
      <StyledBullets
        activeBullet={activeIndex}
        bullets={interactiveIndexes}
        interactionEnabled={interactionEnabled}
        onBullet={onSetActiveIndex}
      />
    </div>
  );
};
