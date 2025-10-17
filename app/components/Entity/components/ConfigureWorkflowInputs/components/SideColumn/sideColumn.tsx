import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CollapsableSection } from "@databiosphere/findable-ui/lib/components/common/Section/components/CollapsableSection/collapsableSection";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Props } from "./types";
import {
  buildAssemblyDetails,
  buildWorkflowConfiguration,
  buildWorkflowDetails,
} from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const SideColumn = ({
  configuredInput,
  configuredSteps,
  genome,
  workflow,
}: Props): JSX.Element => {
  return (
    <FluidPaper>
      <GridPaper>
        <CollapsableSection title="Configuration">
          <KeyValuePairs
            {...buildWorkflowConfiguration(configuredInput, configuredSteps)}
          />
        </CollapsableSection>
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
