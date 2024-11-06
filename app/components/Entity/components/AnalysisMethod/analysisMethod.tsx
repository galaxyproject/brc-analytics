import { SouthIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SouthIcon/southIcon";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { useAsync } from "@databiosphere/findable-ui/src/hooks/useAsync";
import { Chip } from "@mui/material";
import { WORKFLOW_IDS_BY_ANALYSIS_METHOD } from "app/apis/catalog/brc-analytics-catalog/common/constants";
import { getWorkflowLandingUrl } from "app/utils/galaxy-api";
import { SectionContent, StyledSection } from "./analysisMethod.styles";
import { CHIP_PROPS, ICON_PROPS } from "./constants";
import { Props } from "./types";
import { getChipColor, getChipLabel } from "./utils";

export const AnalysisMethod = ({
  analysisMethod,
  content,
  geneModelUrl,
  genomeVersionAssemblyId,
}: Props): JSX.Element => {
  const workflowId = WORKFLOW_IDS_BY_ANALYSIS_METHOD[analysisMethod];
  const isPreview = Boolean(workflowId);
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <StyledSection
      isPreview={isPreview}
      onClick={async (): Promise<void> => {
        if (!workflowId) return;
        const url =
          landingUrl ??
          (await run(
            getWorkflowLandingUrl(
              workflowId,
              genomeVersionAssemblyId,
              geneModelUrl
            )
          ));
        window.open(
          url,
          ANCHOR_TARGET.BLANK,
          REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
        );
      }}
      role="button"
    >
      <Loading loading={isLoading} panelStyle={LOADING_PANEL_STYLE.INHERIT} />
      <SectionContent>{content}</SectionContent>
      <Chip
        {...CHIP_PROPS}
        color={getChipColor(isPreview)}
        label={getChipLabel(isPreview)}
      />
      <SouthIcon {...ICON_PROPS} />
    </StyledSection>
  );
};
