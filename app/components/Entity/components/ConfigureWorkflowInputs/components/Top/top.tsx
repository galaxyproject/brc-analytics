import { Props } from "../../../../../../views/WorkflowInputsView/types";
import { getBreadcrumbs } from "./utils";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";

export const Top = ({
  entityId,
  entityListType,
  genome,
  workflow,
}: Props): JSX.Element => {
  return (
    <BackPageHero
      breadcrumbs={getBreadcrumbs({
        entityId,
        entityListType,
        genome,
        workflow,
      })}
      title="Configure Inputs"
    />
  );
};
