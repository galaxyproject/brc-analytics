import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { CardActionArea } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardActionArea/cardActionArea";
import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { ForwardArrowIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ForwardArrowIcon/forwardArrowIcon";
import { StyledStack, StyledCard } from "./sectionContentCard.styles";
import { Typography } from "@mui/material";
import { Props } from "./types";
import {
  CARD_PROPS,
  STACK_PROPS,
  SVG_ICON_PROPS,
  TYPOGRAPHY_PROPS,
} from "./constants";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";

export const SectionContentCard = ({
  cardUrl,
  className,
  EndIcon = ForwardArrowIcon,
  image,
  secondaryText,
  StartIcon,
  title,
}: BaseComponentProps &
  Pick<CardProps, "cardUrl" | "secondaryText" | "title"> &
  Props): JSX.Element => {
  return (
    <StyledCard {...CARD_PROPS} className={className}>
      <CardActionArea cardUrl={cardUrl}>
        {StartIcon && <StartIcon sx={{ fontSize: 48 }} />}
        {image && <StaticImage {...image} />}
        <EndIcon {...SVG_ICON_PROPS} />
        <StyledStack {...STACK_PROPS}>
          <CardTitle component="span">{title}</CardTitle>
          {secondaryText && (
            <Typography {...TYPOGRAPHY_PROPS}>{secondaryText}</Typography>
          )}
        </StyledStack>
      </CardActionArea>
    </StyledCard>
  );
};
