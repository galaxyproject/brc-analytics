import { Loading } from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { Button, Grid2, Typography } from "@mui/material";
import { Props } from "./types";
import { TEXT_BODY_500 } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { StyledGrid2 } from "./workflow.styles";
import { TYPOGRAPHY_PROPS } from "../../constants";
import { BUTTON_PROPS, GRID2_PROPS } from "./constants";
import { getWorkflowLandingUrl } from "../../../../../../utils/galaxy-api";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { PAPER_PANEL_STYLE } from "@databiosphere/findable-ui/lib/components/common/Paper/paper";

export const Workflow = ({
  geneModelUrl,
  genomeVersionAssemblyId,
  workflow,
}: Props): JSX.Element => {
  const { trsId, workflowDescription, workflowName } = workflow;
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <StyledGrid2 {...GRID2_PROPS}>
      <Loading loading={isLoading} panelStyle={PAPER_PANEL_STYLE.NONE} />
      <Grid2 container spacing={1}>
        <Typography variant={TEXT_BODY_500}>{workflowName}</Typography>
        <Typography {...TYPOGRAPHY_PROPS}>{workflowDescription}</Typography>
      </Grid2>
      <Button
        {...BUTTON_PROPS}
        disabled={!trsId}
        onClick={async (): Promise<void> => {
          const url =
            landingUrl ??
            (await run(
              getWorkflowLandingUrl(
                trsId,
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
      >
        Launch Galaxy
      </Button>
    </StyledGrid2>
  );
};
