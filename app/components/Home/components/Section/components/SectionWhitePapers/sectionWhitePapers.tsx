import { SectionTitle } from "@/components/Home/components/Section/section.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import {
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import { formatDate } from "@repo/shared/utils/date-fns/utils";
import Link from "next/link";
import { JSX } from "react";
import { WHITE_PAPERS } from "./constants";
import {
  Section,
  SectionLayout,
  StyledCard,
  StyledDivider,
  StyledGrid,
} from "./sectionWhitePapers.styles";

export const SectionWhitePapers = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <SectionTitle>Analyzed on BRC Analytics</SectionTitle>
        <StyledGrid>
          {WHITE_PAPERS.map(({ date, href, imageSrc, title }) => (
            <StyledCard key={title} elevation={0}>
              <CardActionArea component={Link} href={href}>
                <CardMedia alt={title} component="img" src={imageSrc} />
                <CardContent>
                  <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}>
                    {title}
                  </Typography>
                  <Typography
                    color={TYPOGRAPHY_PROPS.COLOR.INK_LIGHT}
                    variant={TYPOGRAPHY_PROPS.VARIANT.BODY_LARGE_400}
                  >
                    {formatDate(new Date(date))}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </StyledCard>
          ))}
        </StyledGrid>
      </SectionLayout>
      <StyledDivider />
    </Section>
  );
};
