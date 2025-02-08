import { SouthIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SouthIcon/southIcon";
import { STATUS_BADGE_COLOR } from "@databiosphere/findable-ui/lib/components/common/StatusBadge/statusBadge";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { Chip } from "@mui/material";
import { getWorkflowLandingUrl } from "app/utils/galaxy-api";
import { SectionContent, StyledSection } from "./analysisMethod.styles";
import { CHIP_PROPS, ICON_PROPS } from "./constants";
import { Props } from "./types";

export const AnalysisMethod = ({
  content,
  geneModelUrl,
  genomeVersionAssemblyId,
  workflowId,
}: Props): JSX.Element => {
  const isAvailable = Boolean(workflowId);
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <StyledSection
      isAvailable={isAvailable}
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
      {!isAvailable && (
        <Chip
          {...CHIP_PROPS}
          color={STATUS_BADGE_COLOR.DEFAULT}
          label="Coming Soon"
        />
      )}
      <SouthIcon {...ICON_PROPS} />
    </StyledSection>
  );
};
