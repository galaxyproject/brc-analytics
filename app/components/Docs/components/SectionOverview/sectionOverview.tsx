import { Props } from "./types";
import { StyledStack, StyledCard } from "./sectionOverview.styles";
import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { CardMedia, Stack, Typography } from "@mui/material";
import { CardActionArea } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardActionArea/cardActionArea";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const SectionOverview = ({ overview }: Props): JSX.Element | null => {
  if (!overview) return null;
  return (
    <StyledStack useFlexGap>
      {overview.map(({ date, href, image, title }) => {
        return (
          <StyledCard key={String(title)} elevation={0}>
            <CardActionArea cardUrl={href}>
              <CardMedia alt={title} component="img" src={image?.src} />
              <Stack gap={3} useFlexGap>
                <CardTitle>{title}</CardTitle>
                <Typography
                  color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                  variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_400}
                >
                  {date}
                </Typography>
              </Stack>
            </CardActionArea>
          </StyledCard>
        );
      })}
    </StyledStack>
  );
};
