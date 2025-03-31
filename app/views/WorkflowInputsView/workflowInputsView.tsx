import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";
import { Main } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Main/main";

export const WorkflowInputsView = (props: Props): JSX.Element => {
  return (
    <Detail
      mainColumn={<Main {...props} />}
      sideColumn={<SideColumn {...props} />}
      top={<Top {...props} />}
    />
  );
};
