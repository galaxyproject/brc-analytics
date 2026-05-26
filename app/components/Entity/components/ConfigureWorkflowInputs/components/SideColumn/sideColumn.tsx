import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CollapsableSection } from "@databiosphere/findable-ui/lib/components/common/Section/components/CollapsableSection/collapsableSection";
import { JSX } from "react";
import {
  buildAssemblyDetails,
  buildWorkflowConfiguration,
  buildWorkflowDetails,
} from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { useAssembly } from "../../providers/Assembly/hook";
import { Props } from "./types";

export const SideColumn = ({
  configuredInput,
  configuredSteps,
  workflow,
}: Props): JSX.Element => {
  const assembly = useAssembly();
  return (
    <FluidPaper>
      <GridPaper>
        <CollapsableSection key="workflow-details" title="Workflow Details">
          <KeyValuePairs {...buildWorkflowDetails(workflow)} />
        </CollapsableSection>
        {assembly && (
          <CollapsableSection key="assembly-details" title="Assembly Details">
            <KeyValuePairs {...buildAssemblyDetails(assembly)} />
          </CollapsableSection>
        )}
        <CollapsableSection key="configuration" title="Configuration">
          <KeyValuePairs
            {...buildWorkflowConfiguration(configuredInput, configuredSteps)}
          />
        </CollapsableSection>
      </GridPaper>
    </FluidPaper>
  );
};
