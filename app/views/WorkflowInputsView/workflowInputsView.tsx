import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Assembly, Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { getAssembly } from "../../services/workflows/entities";
import { getWorkflow } from "../../services/workflows/entities";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import Error from "next/error";
import { DIFFERENTIAL_EXPRESSION_ANALYSIS } from "../../components/Entity/components/AnalysisMethod/components/DifferentialExpressionAnalysis/constants";

export const WorkflowInputsView = ({ entityId, trsId }: Props): JSX.Element => {
  const genome = getAssembly<Assembly>(entityId);
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);

  const isDEEnabled = useFeatureFlag("de");

  if (!isDEEnabled && workflow.trsId === DIFFERENTIAL_EXPRESSION_ANALYSIS.trsId)
    return <Error statusCode={404} />;

  return (
    <Detail
      mainColumn={
        <Main
          configuredInput={configuredInput}
          configuredSteps={configuredSteps}
          genome={genome}
          onConfigure={onConfigure}
          workflow={workflow}
        />
      }
      sideColumn={
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
      }
      top={<Top entityId={entityId} genome={genome} workflow={workflow} />}
    />
  );
};
