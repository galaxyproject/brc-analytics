import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { TYPOGRAPHY_PROPS } from "@databiosphere/findable-ui/lib/styles/common/mui/typography";
import { ChevronRightRounded } from "@mui/icons-material";
import {
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import { Fragment, JSX } from "react";
import { StyledAccordion } from "./accordion.styles";
import { Workflow } from "./components/Workflow/workflow";
import {
  CHIP_PROPS,
  TYPOGRAPHY_PROPS as COMPONENT_TYPOGRAPHY_PROPS,
  SVG_ICON_PROPS,
} from "./constants";
import { Props } from "./types";

/**
 * Accordion component that displays a category of workflows and its compatible workflows.
 * @param props - Component props.
 * @param props.disabled - Whether the accordion is disabled.
 * @param props.entityId - Assembly Entity ID.
 * @param props.workflowCategory - Workflow category.
 * @param props.workflows - Compatible workflows for the assembly and workflow category.
 * @returns A JSX element representing an accordion for a workflow category.
 */
export const Accordion = ({
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
          variant={TYPOGRAPHY_PROPS.VARIANT.HEADING_SMALL}
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
