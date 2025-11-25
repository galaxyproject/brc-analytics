import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Assembly } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";
import { Props } from "../../../pages/data/[entityListType]/[entityId]/[trsId]";
import { getAssembly } from "../../services/workflows/entities";
import { getWorkflow } from "../../services/workflows/entities";

export const WorkflowInputsView = ({ entityId, trsId }: Props): JSX.Element => {
  const genome = getAssembly<Assembly>(entityId);
  const workflow = getWorkflow(trsId);

  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);

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
