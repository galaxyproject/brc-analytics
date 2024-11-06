import {
  FluidPaper,
  GridPaper,
} from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { GridPaperSection } from "@databiosphere/findable-ui/lib/components/common/Section/section.styles";
import { Props } from "./types";

export const AnalysisMethods = ({ children }: Props): JSX.Element => {
  return (
    <FluidPaper>
      <GridPaper>
        <GridPaperSection>Choose Analysis Method</GridPaperSection>
        {children}
      </GridPaper>
    </FluidPaper>
  );
};
