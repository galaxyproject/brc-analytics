import { SouthIcon } from "@databiosphere/findable-ui/lib/components/common/CustomIcon/components/SouthIcon/southIcon";
import {
  Loading,
  LOADING_PANEL_STYLE,
} from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { Grid2, Typography } from "@mui/material";
import { Props } from "./types";
import { TEXT_BODY_500 } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { getWorkflowLandingUrl } from "../../../../../../utils/galaxy-api";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { StyledGrid2 } from "./workflow.styles";
import { TYPOGRAPHY_PROPS } from "../../constants";
import { GRID2_PROPS, ICON_PROPS } from "./constants";

export const Workflow = ({
  geneModelUrl,
  genomeVersionAssemblyId,
  workflow,
}: Props): JSX.Element => {
  const { trsId, workflowDescription, workflowName } = workflow;
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <StyledGrid2
      {...GRID2_PROPS}
      onClick={async (): Promise<void> => {
        if (!trsId) return;
        const url =
          landingUrl ??
          (await run(
            getWorkflowLandingUrl(trsId, genomeVersionAssemblyId, geneModelUrl)
          ));
        window.open(
          url,
          ANCHOR_TARGET.BLANK,
          REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
        );
      }}
    >
      <Loading loading={isLoading} panelStyle={LOADING_PANEL_STYLE.INHERIT} />
      <Grid2 container spacing={1}>
        <Typography variant={TEXT_BODY_500}>{workflowName}</Typography>
        <Typography {...TYPOGRAPHY_PROPS}>{workflowDescription}</Typography>
      </Grid2>
      <SouthIcon {...ICON_PROPS} />
    </StyledGrid2>
  );
};
