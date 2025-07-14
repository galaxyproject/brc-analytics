import { Loading } from "@databiosphere/findable-ui/lib/components/Loading/loading";
import { useAsync } from "@databiosphere/findable-ui/lib/hooks/useAsync";
import { Button, Grid, Typography } from "@mui/material";
import { Props } from "./types";
import { TEXT_BODY_500 } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { StyledGrid } from "./workflow.styles";
import { TYPOGRAPHY_PROPS } from "../../constants";
import { BUTTON_PROPS, GRID_PROPS } from "./constants";
import { getWorkflowLandingUrl } from "../../../../../../utils/galaxy-api/galaxy-api";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { PAPER_PANEL_STYLE } from "@databiosphere/findable-ui/lib/components/common/Paper/paper";
import Link from "next/link";
import { ROUTES } from "../../../../../../../routes/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { formatTrsId } from "../../../AnalysisMethodsCatalog/utils";

export const Workflow = ({
  entityId,
  geneModelUrl,
  genomeVersionAssemblyId,
  isFeatureEnabled,
  workflow,
}: Props): JSX.Element => {
  const { iwcId, parameters, workflowDescription, workflowName } = workflow;
  const { data: landingUrl, isLoading, run } = useAsync<string>();
  return (
    <StyledGrid {...GRID_PROPS}>
      <Loading loading={isLoading} panelStyle={PAPER_PANEL_STYLE.NONE} />
      <Grid container spacing={1}>
        <Typography variant={TEXT_BODY_500}>{workflowName}</Typography>
        <Typography {...TYPOGRAPHY_PROPS}>{workflowDescription}</Typography>
      </Grid>
      <Grid container spacing={1}>
        {isFeatureEnabled ? (
          <Grid>
            <Button
              {...BUTTON_PROPS}
              component={Link}
              disabled={!workflow.trsId}
              href={replaceParameters(ROUTES.CONFIGURE_WORKFLOW, {
                entityId,
                trsId: formatTrsId(workflow.trsId),
              })}
              rel={REL_ATTRIBUTE.NO_OPENER}
            >
              Configure Inputs
            </Button>
          </Grid>
        ) : (
          <Grid>
            <Button
              {...BUTTON_PROPS}
              disabled={!workflow.trsId}
              onClick={async (): Promise<void> => {
                const url =
                  landingUrl ??
                  (await run(
                    getWorkflowLandingUrl(
                      workflow.trsId,
                      genomeVersionAssemblyId,
                      geneModelUrl,
                      null, // Read runs.
                      parameters
                    )
                  ));
                window.open(
                  url,
                  ANCHOR_TARGET.BLANK,
                  REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
                );
              }}
            >
              Launch in Galaxy
            </Button>
          </Grid>
        )}
        {iwcId && (
          <Grid>
            <Button
              {...BUTTON_PROPS}
              variant="outlined"
              onClick={(): void => {
                window.open(
                  `https://iwc.galaxyproject.org/workflow/${iwcId}`,
                  ANCHOR_TARGET.BLANK,
                  REL_ATTRIBUTE.NO_OPENER_NO_REFERRER
                );
              }}
            >
              View Workflow Details
            </Button>
          </Grid>
        )}
      </Grid>
    </StyledGrid>
  );
};
