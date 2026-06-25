import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX, useMemo } from "react";
import { StepConfig } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { AssemblyContext } from "../../components/Entity/components/ConfigureWorkflowInputs/providers/Assembly/context";
import { WorkflowEntityContext } from "../../components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/context";
import { buildWorkflowEntityValue } from "../../components/Entity/components/ConfigureWorkflowInputs/providers/WorkflowEntity/utils";
import { ENTITY_KEYS } from "../../providers/workflowHandoff/constants";
import { HandoffStatusContext } from "../../providers/workflowHandoff/contexts/HandoffStatus/context";
import { getAssembly, getWorkflow } from "../../services/workflows/entities";
import { useAssistantHandoff } from "./hooks/UseAssistantHandoff/useAssistantHandoff";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { useHandoffSync } from "./hooks/UseHandoffSync/useHandoffSync";
import { SEQUENCING_STEP_KEYS } from "./sequencing/constants";
import { Assembly, Props } from "./types";
import { mapAssemblyToOrganism } from "./utils";
import { StyledBackPageContentMainColumn } from "./workflowInputsView.styles";

const DATA_STEP_KEYS = new Set([...SEQUENCING_STEP_KEYS, "sampleSheet"]);

function findFirstDataStep(steps: StepConfig[]): number | undefined {
  const idx = steps.findIndex((s) => DATA_STEP_KEYS.has(s.key));
  return idx >= 0 ? idx : undefined;
}

export const WorkflowInputsView = ({ entityId, trsId }: Props): JSX.Element => {
  const genome = getAssembly<Assembly>(entityId);
  const workflow = getWorkflow(trsId);

  const { initialConfiguredInput, isHandoff } = useAssistantHandoff(
    ENTITY_KEYS.ASSEMBLIES
  );

  const { configuredInput, onConfigure } = useConfigureInputs(
    initialConfiguredInput
  );

  const { configuredSteps } = useConfiguredSteps(workflow);
  const handoff = useHandoffSync(
    onConfigure,
    configuredSteps,
    ENTITY_KEYS.ASSEMBLIES
  );

  const handoffTargetStep = isHandoff
    ? findFirstDataStep(configuredSteps)
    : undefined;

  const { activeStep, onContinue, onEdit } = useStepper(
    configuredSteps,
    handoffTargetStep
  );
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const workflowEntityValue = useMemo(
    () => buildWorkflowEntityValue(genome),
    [genome]
  );

  const organism = useMemo(() => mapAssemblyToOrganism(genome), [genome]);

  return (
    <WorkflowEntityContext.Provider value={workflowEntityValue}>
      <AssemblyContext.Provider value={genome}>
        <HandoffStatusContext.Provider value={handoff}>
          <BackPageView>
            <BackPageHero>
              <Top entityId={entityId} genome={genome} workflow={workflow} />
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
                    organism={organism}
                    workflow={workflow}
                  />
                </BackPageContentSideColumn>
              )}
            </BackPageContent>
          </BackPageView>
        </HandoffStatusContext.Provider>
      </AssemblyContext.Provider>
    </WorkflowEntityContext.Provider>
  );
};
