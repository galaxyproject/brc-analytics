import { Button, Grid, Typography } from "@mui/material";
import { Props } from "./types";
import { StyledGrid } from "./workflow.styles";
import { TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS } from "../../constants";
import { BUTTON_PROPS, GRID_PROPS, OUTLINED_BUTTON_PROPS } from "./constants";
import {
  ANCHOR_TARGET,
  REL_ATTRIBUTE,
} from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import Link from "next/link";
import { ROUTES } from "../../../../../../../routes/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { formatTrsId } from "../../../AnalysisMethodsCatalog/utils";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const Workflow = ({ entityId, workflow }: Props): JSX.Element => {
  const { iwcId, workflowDescription, workflowName } = workflow;
  return (
    <StyledGrid {...GRID_PROPS}>
      <Grid container spacing={1}>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
          {workflowName}
        </Typography>
        <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
          {workflowDescription}
        </Typography>
      </Grid>
      <Grid container spacing={1}>
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
        {iwcId && (
          <Grid>
            <Button
              {...OUTLINED_BUTTON_PROPS}
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
