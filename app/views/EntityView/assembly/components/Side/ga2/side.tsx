import { Box } from "@mui/material";
import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { AnalysisPortals } from "../../../../../../components/Entity/components/AnalysisPortals/analysisPortals";
import { AssemblyFavoriteButton } from "../../../../../../components/Favorites/AssemblyFavoriteButton/assemblyFavoriteButton";
import { buildAssemblyResources } from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { AssemblyDetails } from "../../../../assembly/components/Side/ga2/components/AssemblyDetails/AssemblyDetails";
import { StyledFluidPaper } from "../side.styles";
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
        <Box sx={{ p: 2 }}>
          <AssemblyFavoriteButton accession={assembly.accession} />
        </Box>
        <AssemblyDetails assembly={assembly} />
        <AnalysisPortals
          {...buildAssemblyResources(assembly)}
          title="Resources"
        />
      </StyledFluidPaper>
    </BackPageContentSideColumn>
  );
};
