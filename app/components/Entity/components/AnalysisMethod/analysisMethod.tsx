import {
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Typography,
} from "@mui/material";
import { StyledAccordion } from "./analysisMethod.styles";
import { CHIP_PROPS, ICON_PROPS, TYPOGRAPHY_PROPS } from "./constants";
import { Props } from "./types";
import { FluidPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { TEXT_HEADING_SMALL } from "@databiosphere/findable-ui/lib/theme/common/typography";
import { Fragment } from "react";
import { Workflow } from "./components/Workflow/workflow";
import { ChevronRightRounded } from "@mui/icons-material";

export const AnalysisMethod = ({
  entityId,
  geneModelUrl,
  genomeVersionAssemblyId,
  isFeatureEnabled,
  workflowCategory,
  workflows,
}: Props): JSX.Element => {
  const isDisabled = workflows.length === 0;
  return (
    <StyledAccordion component={FluidPaper} disabled={isDisabled}>
      <AccordionSummary
        expandIcon={
          isDisabled ? (
            <Chip {...CHIP_PROPS} />
          ) : (
            <ChevronRightRounded {...ICON_PROPS} />
          )
        }
      >
        <Typography variant={TEXT_HEADING_SMALL}>
          {workflowCategory.name}
        </Typography>
        <Typography {...TYPOGRAPHY_PROPS}>
          {workflowCategory.description}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {workflows.map((workflow) => (
          <Fragment key={workflow.workflowName}>
            <Divider />
            <Workflow
              entityId={entityId}
              geneModelUrl={geneModelUrl}
              genomeVersionAssemblyId={genomeVersionAssemblyId}
              isFeatureEnabled={isFeatureEnabled}
              workflow={workflow}
            />
          </Fragment>
        ))}
      </AccordionDetails>
    </StyledAccordion>
  );
};
