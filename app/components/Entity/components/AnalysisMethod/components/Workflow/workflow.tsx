import { Button, Grid, Typography } from "@mui/material";
import { Props } from "./types";
import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { StyledGrid } from "./workflow.styles";
import { TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS } from "../../constants";
import { BUTTON_PROPS, GRID_PROPS } from "./constants";
import { REL_ATTRIBUTE } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import Link from "next/link";
import { ROUTES } from "../../../../../../../routes/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { formatTrsId } from "../../../AnalysisMethodsCatalog/utils";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { Fragment } from "react";

export const Workflow = ({ entityId, workflow }: Props): JSX.Element => {
  const { iwcId, workflowDescription, workflowName } = workflow;
  return (
    <StyledGrid {...GRID_PROPS}>
      <Grid container flexDirection="column" spacing={1}>
        <Typography variant={TYPOGRAPHY_PROPS.VARIANT.BODY_500}>
          {workflowName}
        </Typography>
        <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
          {workflowDescription}
          {iwcId && (
            <Fragment>
              {" "}
              <DXLink
                color="inherit"
                label="Learn More"
                url={`https://iwc.galaxyproject.org/workflow/${iwcId}`}
              />
            </Fragment>
          )}
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
      </Grid>
    </StyledGrid>
  );
};
