import { buildOrganismDetails } from "@brc/viewModelBuilders/viewModelBuilders";
import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { AssemblyFavoriteButton } from "@repo/shared/components/Favorites/components/AssemblyFavoriteButton/assemblyFavoriteButton";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import {
  buildAssemblyDetails,
  buildAssemblyResources,
} from "@repo/shared/viewModelBuilders/viewModelBuilders";
import { AnalysisPortals } from "@repo/shared/views/EntityView/assembly/components/Side/AnalysisPortals/analysisPortals";
import { KeyValueSection } from "@repo/shared/views/EntityView/components/KeyValueSection/keyValueSection";
import { StyledFluidPaper } from "@repo/shared/views/EntityView/ui/FluidPaper/fluidPaper.styles";
import { mapAssemblyToOrganism } from "@repo/shared/views/WorkflowInputsView/utils";
import { type JSX } from "react";
import { StyledSection } from "./side.styles";
import { type Props } from "./types";

/**
 * Side column component for the BRC AnalyzeView, displaying assembly details and resources.
 * @param props - Component props.
 * @param props.assembly - Assembly.
 * @returns JSX element representing the side column content.
 */
export const Side = ({ assembly }: Props): JSX.Element => {
  const { isConfigured } = useAuth();
  return (
    <BackPageContentSideColumn>
      <StyledFluidPaper>
        {/* Without auth configured the favorite button renders nothing; skip
            the section too so it doesn't leave an empty padded strip. */}
        {isConfigured && (
          <StyledSection>
            <AssemblyFavoriteButton accession={assembly.accession} />
          </StyledSection>
        )}
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
