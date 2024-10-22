import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { CardSection } from "@databiosphere/findable-ui/lib/components/common/Card/card.styles";
import { CardText } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardText/cardText";
import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { useAsync } from "@databiosphere/findable-ui/src/hooks/useAsync";
import { Card } from "@mui/material";
import { WORKFLOW_IDS_BY_ANALYSIS_METHOD } from "app/apis/catalog/brc-analytics-catalog/common/constants";
import { getWorkflowLandingUrl } from "app/utils/galaxy-api";
import { ANALYSIS_METHOD } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  StyledButtonPrimary,
  StyledCardContent,
} from "./analysisMethod.styles";

export interface AnalysisMethodProps extends CardProps {
  analysisMethod: ANALYSIS_METHOD;
  genomeVersionAssemblyId: string;
}

export const AnalysisMethod = ({
  analysisMethod,
  genomeVersionAssemblyId,
  Paper = FluidPaper,
  text,
  title,
}: AnalysisMethodProps): JSX.Element => {
  const workflowId = WORKFLOW_IDS_BY_ANALYSIS_METHOD[analysisMethod];
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <Card component={Paper}>
      <CardSection>
        <StyledCardContent>
          <CardTitle>{title}</CardTitle>
          <CardText>{text}</CardText>
        </StyledCardContent>
        <StyledButtonPrimary
          disabled={!workflowId || isLoading}
          onClick={async (): Promise<void> => {
            if (!workflowId) return;
            const url =
              landingUrl ??
              (await run(
                getWorkflowLandingUrl(workflowId, genomeVersionAssemblyId)
              ));
            window.open(
              url,
              ANCHOR_TARGET.BLANK,
              REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
            );
          }}
        >
          {isLoading ? "Loading..." : "Analyze"}
        </StyledButtonPrimary>
      </CardSection>
    </Card>
  );
};
