import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";
import { useConfigureInputs } from "./hooks/UseConfigureInputs/useConfigureInputs";

export const WorkflowInputsView = (props: Props): JSX.Element => {
  const { configuredInput, onConfigure } = useConfigureInputs();
  return (
    <Detail
      mainColumn={
        <Main
          configuredInput={configuredInput}
          onConfigure={onConfigure}
          {...props}
        />
      }
      sideColumn={
        <SideColumn
          configuredInput={configuredInput}
          entityListType={props.entityListType}
          genome={props.genome}
          workflow={props.workflow}
        />
      }
      top={<Top {...props} />}
    />
  );
};
