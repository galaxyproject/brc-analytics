import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX, useMemo } from "react";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { WorkflowEntityContext } from "../../components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/context";
import { getWorkflow } from "../../services/workflows/entities";
import { getEntity } from "../../services/workflows/query";
import type { Organism } from "../OrganismWorkflowsView/types";
import { useConfigureInputs } from "../WorkflowInputsView/hooks/UseConfigureInputs/useConfigureInputs";
import { StyledBackPageContentMainColumn } from "../WorkflowInputsView/workflowInputsView.styles";
import { Top } from "./components/Top/top";
import type { Props } from "./types";

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
  const organism = getEntity<Organism>("organisms", entityId);
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const workflowEntityValue = useMemo(
    () => ({
      ncbiTaxonomyId: organism.ncbiTaxonomyId,
      taxonomicLevelSpecies: organism.taxonomicLevelSpecies,
    }),
    [organism.ncbiTaxonomyId, organism.taxonomicLevelSpecies]
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
              genome={undefined}
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
                workflow={workflow}
              />
            </BackPageContentSideColumn>
          )}
        </BackPageContent>
      </BackPageView>
    </WorkflowEntityContext.Provider>
  );
};
