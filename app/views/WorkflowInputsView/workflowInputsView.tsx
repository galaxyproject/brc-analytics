import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";
import { SideColumn } from "../../components/Entity/components/ConfigureWorkflowInputs/components/SideColumn/sideColumn";

export const WorkflowInputsView = (props: Props): JSX.Element => {
  return (
    <Detail
      mainColumn={null}
      sideColumn={<SideColumn {...props} />}
      top={<Top {...props} />}
    />
  );
};
