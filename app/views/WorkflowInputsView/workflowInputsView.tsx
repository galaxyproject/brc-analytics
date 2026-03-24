import {
  BackPageContent,
  BackPageContentSideColumn,
  BackPageHero,
  BackPageView,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { StepConfig } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/components/Step/types";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { getAssembly, getWorkflow } from "../../services/workflows/entities";
import { useAssistantHandoff } from "./hooks/UseAssistantHandoff/useAssistantHandoff";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { Assembly, Props } from "./types";
import { StyledBackPageContentMainColumn } from "./workflowInputsView.styles";

const DATA_STEP_KEYS = new Set([
  "readRunsPaired",
  "readRunsSingle",
  "readRunsAny",
  "sampleSheet",
]);

function findFirstDataStep(steps: StepConfig[]): number | undefined {
  const idx = steps.findIndex((s) => DATA_STEP_KEYS.has(s.key));
  return idx >= 0 ? idx : undefined;
}

export const WorkflowInputsView = ({ entityId, trsId }: Props): JSX.Element => {
  const genome = getAssembly<Assembly>(entityId);
  const workflow = getWorkflow(trsId);

  const { handoff } = useAssistantHandoff();
  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);

  const handoffTargetStep = handoff
    ? findFirstDataStep(configuredSteps)
    : undefined;
  const initialDataSourceView =
    handoff?.dataSource === "upload" ? "upload-my-data" : undefined;

  const { activeStep, onContinue, onEdit } = useStepper(
    configuredSteps,
    handoffTargetStep
  );
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  return (
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
            genome={genome}
            initialDataSourceView={initialDataSourceView}
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
              genome={genome}
              workflow={workflow}
            />
          </BackPageContentSideColumn>
        )}
      </BackPageContent>
    </BackPageView>
  );
};
