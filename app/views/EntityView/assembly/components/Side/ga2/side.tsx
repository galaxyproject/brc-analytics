import { AssemblyDetails } from "@/views/EntityView/assembly/components/Side/ga2/components/AssemblyDetails/AssemblyDetails";
import { mapAssemblyToOrganism } from "@/views/WorkflowInputsView/utils";
import { AssemblyFavoriteButton } from "@brc-analytics/core/components/Favorites/components/AssemblyFavoriteButton/assemblyFavoriteButton";
import {
  buildAssemblyResources,
  buildOrganismDetails,
} from "@brc-analytics/core/viewModelBuilders/viewModelBuilders";
import { AnalysisPortals } from "@brc-analytics/core/views/EntityView/assembly/components/Side/AnalysisPortals/analysisPortals";
import { KeyValueSection } from "@brc-analytics/core/views/EntityView/components/KeyValueSection/keyValueSection";
import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { StyledFluidPaper } from "../side.styles";
import { StyledSection } from "./side.styles";
import { Props } from "./types";

/**
 * Side column component for the GA2 AnalyzeView, displaying assembly details and resources.
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
        <AssemblyDetails assembly={assembly} />
        <AnalysisPortals
          {...buildAssemblyResources(assembly)}
          title="Resources"
        />
      </StyledFluidPaper>
    </BackPageContentSideColumn>
  );
};
