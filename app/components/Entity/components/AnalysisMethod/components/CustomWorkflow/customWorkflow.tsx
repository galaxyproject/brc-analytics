import {
  AccordionSummary,
  AccordionDetails,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { Props } from "./types";
import { BUTTON_PROPS } from "../Workflow/constants";
import {
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
  SVG_ICON_PROPS,
} from "../../constants";
import { REL_ATTRIBUTE } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import Link from "next/link";
import { ROUTES } from "../../../../../../../routes/constants";
import { replaceParameters } from "@databiosphere/findable-ui/lib/utils/replaceParameters";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/components/FluidPaper/fluidPaper";
import { CUSTOM_WORKFLOW } from "./constants";
import { StyledAccordion } from "./customWorkflow.styles";
import { ChevronRightRounded } from "@mui/icons-material";

export const CustomWorkflow = ({ entityId }: Props): JSX.Element => {
  const { trsId, workflowDescription, workflowName } = CUSTOM_WORKFLOW;
  return (
    <StyledAccordion component={FluidPaper}>
      <AccordionSummary
        expandIcon={<ChevronRightRounded {...SVG_ICON_PROPS} />}
      >
        <Stack spacing={1} useFlexGap>
          <Typography
            component="h3"
            variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
          >
            {workflowName}
          </Typography>
          <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
            {workflowDescription}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
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
      </AccordionDetails>
    </StyledAccordion>
  );
};
