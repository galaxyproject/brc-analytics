import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { AnalysisPortals } from "../../../../../../components/Entity/components/AnalysisPortals/analysisPortals";
import { AssemblyFavoriteButton } from "../../../../../../components/Favorites/AssemblyFavoriteButton/assemblyFavoriteButton";
import {
  buildAssemblyDetails,
  buildAssemblyResources,
  buildOrganismDetails,
} from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { mapAssemblyToOrganism } from "../../../../../WorkflowInputsView/utils";
import { KeyValueSection } from "../../../../components/KeyValueSection/keyValueSection";
import { StyledFluidPaper } from "../side.styles";
import { StyledSection } from "./side.styles";
import { Props } from "./types";

/**
 * Side column component for the BRC AnalyzeView, displaying assembly details and resources.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns JSX element representing the side column content.
 */
export const Side = ({ assembly }: Props): JSX.Element => {
  return (
    <BackPageContentSideColumn>
      <StyledFluidPaper>
        <StyledSection>
          <AssemblyFavoriteButton accession={assembly.accession} />
        </StyledSection>
        <KeyValueSection
          {...buildOrganismDetails(mapAssemblyToOrganism(assembly))}
          title="Organism Details"
        />
        <KeyValueSection
          {...buildAssemblyDetails(assembly)}
          title="Assembly Details"
        />
        <AnalysisPortals
          {...buildAssemblyResources(assembly)}
          title="Resources"
        />
      </StyledFluidPaper>
    </BackPageContentSideColumn>
  );
};
