import { CardProps } from "@databiosphere/findable-ui/lib/components/common/Card/card";
import { CardSection } from "@databiosphere/findable-ui/lib/components/common/Card/card.styles";
import { CardText } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardText/cardText";
import { CardTitle } from "@databiosphere/findable-ui/lib/components/common/Card/components/CardTitle/cardTitle";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Card } from "@mui/material";
import { WORKFLOW_IDS_BY_ANALYSIS_METHOD } from "app/apis/catalog/brc-analytics-catalog/common/constants";
import { getWorkflowLandingId } from "app/utils/galaxy-api";
import { useState } from "react";
import { ANALYSIS_METHOD } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";
import {
  StyledButtonPrimary,
  StyledCardContent,
} from "./analysisMethod.styles";

export interface AnalysisMethodProps extends CardProps {
  analysisMethod: ANALYSIS_METHOD;
  genomeVersionAssemblyId: string;
}

const WORKFLOW_LANDING_URL_PREFIX =
  "https://test.galaxyproject.org/workflow_landings/";

export const AnalysisMethod = ({
  analysisMethod,
  genomeVersionAssemblyId,
  Paper = FluidPaper,
  text,
  title,
}: AnalysisMethodProps): JSX.Element => {
  const workflowId = WORKFLOW_IDS_BY_ANALYSIS_METHOD[analysisMethod];
  const [urlIsLoading, setUrlIsLoading] = useState(false);
  return (
    <Card component={Paper}>
      <CardSection>
        <StyledCardContent>
          <CardTitle>{title}</CardTitle>
          <CardText>{text}</CardText>
        </StyledCardContent>
        <StyledButtonPrimary
          disabled={!workflowId || urlIsLoading}
          onClick={async (): Promise<void> => {
            if (!workflowId) return;
            setUrlIsLoading(true);
            const url =
              WORKFLOW_LANDING_URL_PREFIX +
              encodeURIComponent(
                await getWorkflowLandingId(workflowId, genomeVersionAssemblyId)
              );
            setUrlIsLoading(false);
            window.open(
              url,
              ANCHOR_TARGET.BLANK,
              REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
            );
          }}
        >
          {urlIsLoading ? "Loading..." : "Analyze"}
        </StyledButtonPrimary>
      </CardSection>
    </Card>
  );
};
