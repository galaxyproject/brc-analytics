import { Detail } from "@databiosphere/findable-ui/lib/components/Detail/detail";
import { Props } from "./types";
import { Top } from "../../components/Entity/components/ConfigureWorkflowInputs/components/Top/top";

export const WorkflowInputsView = (props: Props): JSX.Element => {
  return (
    <Detail mainColumn={null} sideColumn={null} top={<Top {...props} />} />
  );
};
