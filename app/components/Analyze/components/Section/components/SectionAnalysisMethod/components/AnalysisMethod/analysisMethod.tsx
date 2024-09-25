import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { TEXT_BODY_SMALL_400_2_LINES } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Card, Typography } from "@mui/material";
import {
  StyledButtonPrimary,
  StyledCardContent,
  StyledCardSection,
} from "./analysisMethod.styles";

export interface AnalysisMethodProps extends CardProps {
  url: string;
}

export const AnalysisMethod = ({
  Paper = RoundedPaper,
  text,
  title,
  url,
}: AnalysisMethodProps): JSX.Element => {
  return (
    <Card component={Paper}>
      <StyledCardSection>
        <StyledCardContent>
          <CardTitle>{title}</CardTitle>
          <Typography color="ink.light" variant={TEXT_BODY_SMALL_400_2_LINES}>
            {text}
          </Typography>
        </StyledCardContent>
        <StyledButtonPrimary
          disabled={!url}
          onClick={(): void => {
            window.open(
              url,
              ANCHOR_TARGET.BLANK,
              REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
            );
          }}
        >
          Analyze
        </StyledButtonPrimary>
      </StyledCardSection>
    </Card>
  );
};
