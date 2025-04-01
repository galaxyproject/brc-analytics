import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CollapsableSection } from "@databiosphere/findable-ui/lib/components/common/Section/components/CollapsableSection/collapsableSection";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Props } from "./types";
import {
  buildAssemblyDetails,
  buildWorkflowDetails,
} from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const SideColumn = ({ genome, workflow }: Props): JSX.Element => {
  return (
    <FluidPaper>
      <GridPaper>
        <CollapsableSection title="Configuration">None</CollapsableSection>
        <CollapsableSection title="Workflow Details">
          <KeyValuePairs {...buildWorkflowDetails(workflow)} />
        </CollapsableSection>
        <CollapsableSection title="Assembly Details">
          <KeyValuePairs {...buildAssemblyDetails(genome)} />
        </CollapsableSection>
      </GridPaper>
    </FluidPaper>
  );
};
