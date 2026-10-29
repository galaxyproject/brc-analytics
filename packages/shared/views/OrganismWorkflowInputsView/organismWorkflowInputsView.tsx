import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { getWorkflow } from "@repo/shared/services/workflows/entities";
import { useStepper } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { SEQUENCING_STEPS } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useConfiguredSteps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { Main } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { AssemblyContext } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/Assembly/context";
import { WorkflowEntityContext } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/context";
import { buildWorkflowEntityValue } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/WorkflowEntity/utils";
import { useConfigureInputs } from "@repo/shared/views/WorkflowInputsView/hooks/UseConfigureInputs/useConfigureInputs";
import { StyledBackPageContentMainColumn } from "@repo/shared/views/WorkflowInputsView/workflowInputsView.styles";
import { type JSX, useMemo } from "react";
import { Top } from "./components/Top/top";
import type { Props } from "./types";
import { findReferenceAssembly, mapOrganismEntityToOrganism } from "./utils";

/**
 * OrganismWorkflowInputsView displays the workflow configure inputs stepper for organism-scoped workflows.
 * @param props - Component props.
 * @param props.entityId - Organism Entity ID.
 * @param props.organism - Organism.
 * @param props.organismBuilder - Optional builder for the organism details; defaults to the shared builder.
 * @param props.trsId - Workflow TRS ID.
 * @returns A JSX element representing the OrganismWorkflowInputsView.
 */
export const OrganismWorkflowInputsView = ({
  entityId,
  organism,
  organismBuilder,
  trsId,
}: Props): JSX.Element => {
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const workflowEntityValue = useMemo(
    () => buildWorkflowEntityValue(organism),
    [organism]
  );

  // The reference assembly, for steps that read it (e.g. the GTF step).
  const genome = findReferenceAssembly(
    workflowEntityValue?.assemblies,
    configuredInput.referenceAssembly
  );

  const organismDetails = useMemo(
    () => mapOrganismEntityToOrganism(organism),
    [organism]
  );

  return (
    <WorkflowEntityContext.Provider value={workflowEntityValue}>
      <AssemblyContext.Provider value={genome}>
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
                  organismBuilder={organismBuilder}
                  workflow={workflow}
                />
              </BackPageContentSideColumn>
            )}
          </BackPageContent>
        </BackPageView>
      </AssemblyContext.Provider>
    </WorkflowEntityContext.Provider>
  );
};
