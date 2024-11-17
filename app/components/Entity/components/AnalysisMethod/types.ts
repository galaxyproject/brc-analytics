import { ReactNode } from "react";
import { ANALYSIS_METHOD } from "../../../../apis/catalog/brc-analytics-catalog/common/entities";

export interface Props {
  analysisMethod: ANALYSIS_METHOD;
  content: ReactNode;
  geneModelUrl: string | null;
  genomeVersionAssemblyId: string;
}
