import { BackPageContentSideColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { JSX } from "react";
import { AnalysisPortals } from "../../../../../../components/Entity/components/AnalysisPortals/analysisPortals";
import {
  buildAssemblyDetails,
  buildAssemblyResources,
} from "../../../../../../viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { KeyValueSection } from "../../../../components/KeyValueSection/keyValueSection";
import { StyledFluidPaper } from "../side.styles";
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
