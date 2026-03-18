import { REL_ATTRIBUTE } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/button";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { Button, Grid, Typography } from "@mui/material";
import Link from "next/link";
import { Fragment, JSX } from "react";
import { ROUTES } from "../../../../../../../../../routes/constants";
import { formatTrsId } from "../../../../utils";
import { TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS } from "../../constants";
import { GRID_PROPS } from "./constants";
import { Props } from "./types";
import { StyledGrid } from "./workflow.styles";

/**
 * Workflow component that displays a compatible workflow for the assembly and workflow category, and a link to configure the workflow inputs.
 * @param props - Component props.
 * @param props.entityId - Assembly Entity ID.
 * @param props.workflow - Compatible workflow for the assembly and workflow category.
 * @returns A JSX element representing a compatible workflow and a link to configure the workflow inputs.
 */
export const Workflow = ({ entityId, workflow }: Props): JSX.Element => {
  const { iwcId, workflowDescription, workflowName } = workflow;
  return (
    <StyledGrid {...GRID_PROPS}>
      <Grid container direction="column" spacing={1}>
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
            color={BUTTON_PROPS.COLOR.PRIMARY}
            component={Link}
            disabled={!workflow.trsId}
            href={replaceParameters(ROUTES.CONFIGURE_WORKFLOW, {
              entityId,
              trsId: formatTrsId(workflow.trsId),
            })}
            rel={REL_ATTRIBUTE.NO_OPENER}
            variant={BUTTON_PROPS.VARIANT.CONTAINED}
          >
            Configure Inputs
          </Button>
        </Grid>
      </Grid>
    </StyledGrid>
  );
};
