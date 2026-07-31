import type { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { ForwardArrowIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/ForwardArrowIcon/forwardArrowIcon";
import { StaticImage } from "@databiosphere/findable-ui/lib/components/common/StaticImage/staticImage";
import type { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { Typography } from "@mui/material";
import { CardActionArea } from "@repo/shared/components/CardActionArea/cardActionArea";
import { type JSX } from "react";
import {
  CARD_PROPS,
  STACK_PROPS,
  SVG_ICON_PROPS,
  TYPOGRAPHY_PROPS,
} from "./constants";
import { StyledCard, StyledStack } from "./sectionContentCard.styles";
import type { Props } from "./types";

export const SectionContentCard = ({
  className,
  EndIcon = ForwardArrowIcon,
  href,
  image,
  secondaryText,
  StartIcon,
  title,
}: BaseComponentProps &
  Pick<CardProps, "secondaryText" | "title"> &
  Props): JSX.Element => {
  return (
    <StyledCard {...CARD_PROPS} className={className}>
      <CardActionArea href={href}>
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
