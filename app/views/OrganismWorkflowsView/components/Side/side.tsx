import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { StyledFluidPaper } from "../../../EntityView/assembly/components/Side/side.styles";
import { KeyValueSection } from "../../../EntityView/components/KeyValueSection/keyValueSection";
import type { Props } from "./types";
import { buildOrganismDetails } from "./utils";

/**
 * Side column component for the OrganismWorkflowsView, displaying organism details.
 * @param props - Component props.
 * @param props.organism - Organism.
 * @returns JSX element representing the side column content.
 */
export const Side = ({ organism }: Props): JSX.Element => {
  return (
    <BackPageContentSideColumn>
      <StyledFluidPaper>
        <KeyValueSection
          {...buildOrganismDetails(organism)}
          title="Organism Details"
        />
      </StyledFluidPaper>
    </BackPageContentSideColumn>
  );
};
