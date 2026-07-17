import type { BRCDataCatalogOrganism } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import type { GA2OrganismEntity } from "@/apis/catalog/ga2/entities";
import { useStepper } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { SEQUENCING_STEPS } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useConfiguredSteps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { Main } from "@/components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "@/components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { getWorkflow } from "@/services/workflows/entities";
import { WorkflowEntityContext } from "@brc-analytics/core/components/ConfigureWorkflowInputs/providers/WorkflowEntity/context";
import { buildWorkflowEntityValue } from "@brc-analytics/core/components/ConfigureWorkflowInputs/providers/WorkflowEntity/utils";
import { getEntity } from "@brc-analytics/core/services/workflows/query";
import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX, useMemo } from "react";
import { useConfigureInputs } from "../WorkflowInputsView/hooks/UseConfigureInputs/useConfigureInputs";
import { StyledBackPageContentMainColumn } from "../WorkflowInputsView/workflowInputsView.styles";
import { Top } from "./components/Top/top";
import type { Props } from "./types";
import { mapOrganismEntityToOrganism } from "./utils";

/**
 * OrganismWorkflowInputsView displays the workflow configure inputs stepper for organism-scoped workflows.
 * @param props - Component props.
 * @param props.entityId - Organism Entity ID.
 * @param props.trsId - Workflow TRS ID.
 * @returns A JSX element representing the OrganismWorkflowInputsView.
 */
export const OrganismWorkflowInputsView = ({
  entityId,
  trsId,
}: Props): JSX.Element => {
  const organism = getEntity<BRCDataCatalogOrganism | GA2OrganismEntity>(
    "organisms",
    entityId
  );
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const workflowEntityValue = useMemo(
    () => buildWorkflowEntityValue(organism),
    [organism]
  );

  const organismDetails = useMemo(
    () => mapOrganismEntityToOrganism(organism),
    [organism]
  );

  return (
    <WorkflowEntityContext.Provider value={workflowEntityValue}>
      <BackPageView>
        <BackPageHero>
          <Top entityId={entityId} organism={organism} workflow={workflow} />
        </BackPageHero>
        <BackPageContent>
          <StyledBackPageContentMainColumn hasSidePanel={hasSidePanel}>
            <Main
              activeStep={activeStep}
              configuredInput={configuredInput}
              configuredSteps={configuredSteps}
              onConfigure={onConfigure}
              onContinue={onContinue}
              onEdit={onEdit}
              workflow={workflow}
            />
          </StyledBackPageContentMainColumn>
          {!hasSidePanel && (
            <BackPageContentSideColumn>
              <SideColumn
                configuredInput={configuredInput}
                configuredSteps={augmentConfiguredSteps(
                  configuredSteps,
                  configuredInput,
                  SEQUENCING_STEPS
                )}
                organism={organismDetails}
                workflow={workflow}
              />
            </BackPageContentSideColumn>
          )}
        </BackPageContent>
      </BackPageView>
    </WorkflowEntityContext.Provider>
  );
};
