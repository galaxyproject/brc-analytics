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

export const CustomWorkflow = ({ entityId }: Props): JSX.Element => {
  return (
    <FluidPaper>
      <StyledGrid {...GRID_PROPS}>
        <Stack spacing={1}>
          <Typography variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}>
            Custom / No Workflow
          </Typography>
          <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
            Analyze selected data in the context of this assembly in your own
            Galaxy workflow.
          </Typography>
        </Stack>
        <Button
          {...BUTTON_PROPS}
          component={Link}
          href={replaceParameters(ROUTES.CONFIGURE_WORKFLOW, {
            entityId,
            trsId: "custom-workflow",
          })}
          rel={REL_ATTRIBUTE.NO_OPENER}
        >
          Select Data
        </Button>
      </StyledGrid>
    </FluidPaper>
  );
};
