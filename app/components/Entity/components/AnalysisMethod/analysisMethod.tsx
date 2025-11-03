import {
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import { StyledAccordion } from "./analysisMethod.styles";
import {
  CHIP_PROPS,
  SVG_ICON_PROPS,
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
} from "./constants";
import { Props } from "./types";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Fragment } from "react";
import { Workflow } from "./components/Workflow/workflow";
import { ChevronRightRounded } from "@mui/icons-material";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";

export const AnalysisMethod = ({
  disabled,
  entityId,
  workflowCategory,
  workflows,
}: Props): JSX.Element => {
  return (
    <StyledAccordion component={FluidPaper} disabled={disabled}>
      <AccordionSummary
        expandIcon={
          disabled ? (
            <Chip {...CHIP_PROPS} />
          ) : (
            <ChevronRightRounded {...SVG_ICON_PROPS} />
          )
        }
      >
        <Typography
          component="h3"
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_XSMALL}
        >
          {workflowCategory.name}
        </Typography>
        <Typography {...COMPONENT_TYPOGRAPHY_PROPS}>
          {workflowCategory.description}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {workflows.map((workflow) => (
          <Fragment key={workflow.workflowName}>
            <Divider />
            <Workflow entityId={entityId} workflow={workflow} />
          </Fragment>
        ))}
      </AccordionDetails>
    </StyledAccordion>
  );
};
