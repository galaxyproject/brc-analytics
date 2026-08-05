import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CollapsableSection } from "@databiosphere/findable-ui/lib/components/common/Section/components/CollapsableSection/collapsableSection";
import {
  buildAssemblyDetails,
  buildOrganismDetails as defaultOrganismBuilder,
} from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { useAssembly } from "@repo/shared/views/EntityView/components/ConfigureWorkflowInputs/providers/Assembly/hook";
import { type JSX } from "react";
import { type Props } from "./types";
import { buildWorkflowConfiguration, buildWorkflowDetails } from "./utils";

export const SideColumn = ({
  configuredInput,
  configuredSteps,
  organism,
  organismBuilder = defaultOrganismBuilder,
  workflow,
}: Props): JSX.Element => {
  const assembly = useAssembly();
  return (
    <FluidPaper>
      <GridPaper>
        <CollapsableSection key="workflow-details" title="Workflow Details">
          <KeyValuePairs {...buildWorkflowDetails(workflow)} />
        </CollapsableSection>
        {organism && (
          <CollapsableSection key="organism-details" title="Organism Details">
            <KeyValuePairs {...organismBuilder(organism)} />
          </CollapsableSection>
        )}
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
