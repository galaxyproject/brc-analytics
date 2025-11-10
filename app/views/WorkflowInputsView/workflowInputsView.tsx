import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";
import { useConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/hook";
import { augmentConfiguredSteps } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/utils";
import { SEQUENCING_STEPS } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/components/Stepper/steps/constants";

export const WorkflowInputsView = (props: Props): JSX.Element => {
  const { workflow } = props;
  const { configuredInput, onConfigure } = useConfigureInputs();
  const { configuredSteps } = useConfiguredSteps(workflow);
  return (
    <Detail
      mainColumn={
        <Main
          configuredInput={configuredInput}
          configuredSteps={configuredSteps}
          onConfigure={onConfigure}
          {...props}
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
          {...props}
        />
      }
      top={<Top {...props} />}
    />
  );
};
