import { Button, Stack, Typography } from "@mui/material";
import { Props } from "./types";
import { StyledGrid } from "../Workflow/workflow.styles";
import { BUTTON_PROPS, GRID_PROPS } from "../Workflow/constants";
import { TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS } from "../../constants";
import { REL_ATTRIBUTE } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import Link from "next/link";
import { ROUTES } from "../../../../../../../routes/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { CUSTOM_WORKFLOW } from "./constants";

export const CustomWorkflow = ({ entityId }: Props): JSX.Element => {
  const { trsId, workflowDescription, workflowName } = CUSTOM_WORKFLOW;
  return (
    <FluidPaper>
      <StyledGrid {...GRID_PROPS}>
        <Stack spacing={1}>
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
            {workflowName}
          </Typography>
          <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
            {workflowDescription}
          </Typography>
        </Stack>
        <Button
          {...BUTTON_PROPS}
          component={Link}
          href={replaceParameters(ROUTES.CONFIGURE_WORKFLOW, {
            entityId,
            trsId,
          })}
          rel={REL_ATTRIBUTE.NO_OPENER}
        >
          Select Data
        </Button>
      </StyledGrid>
    </FluidPaper>
  );
};
