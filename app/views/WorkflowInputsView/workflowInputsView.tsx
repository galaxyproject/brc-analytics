import { Assembly, Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { useStepper } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/hooks/UseStepper/hook";
import { getAssembly } from "../../services/workflows/entities";
import { getWorkflow } from "../../services/workflows/entities";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import Error from "next/error";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../components/Entity/components/AnalysisMethod/components/DifferentialExpressionAnalysis/constants";
import {
  BackPageContentSideColumn,
  BackPageContent,
  BackPageView,
  BackPageHero,
} from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { StyledBackPageContentMainColumn } from "./workflowInputsView.styles";

export const WorkflowInputsView = ({ entityId, trsId }: Props): JSX.Element => {
  const genome = getAssembly<Assembly>(entityId);
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);
  const { activeStep, onContinue, onEdit } = useStepper(configuredSteps);
  const { hasSidePanel } = configuredSteps[activeStep] || {};

  const isDEEnabled = useFeatureFlag("de");

  if (!isDEEnabled && workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId)
    return <Error statusCode={404} />;

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
