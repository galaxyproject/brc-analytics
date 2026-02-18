import { JSX } from "react";
import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { CollapsableSection } from "@databiosphere/findable-ui/lib/components/common/Section/components/CollapsableSection/collapsableSection";
import { KeyValuePairs } from "@databiosphere/findable-ui/lib/components/common/KeyValuePairs/keyValuePairs";
import { Props } from "./types";
import { buildWorkflowDetails } from "../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const SideColumn = ({ workflow }: Props): JSX.Element => {
  return (
    <FluidPaper>
      <GridPaper>
        <CollapsableSection title="Workflow Details">
          <KeyValuePairs {...buildWorkflowDetails(workflow)} />
        </CollapsableSection>
      </GridPaper>
    </FluidPaper>
  );
};
