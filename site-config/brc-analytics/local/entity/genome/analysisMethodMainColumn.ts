import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { ANALYSIS_METHOD } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../../app/components";
import * as MDX from "../../../../../app/components/Entity/components/AnalysisMethod/content";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const mainColumn: ComponentsConfig = [
  {
    children: [
      {
        children: [
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.VARIANT_CALLING,
                content: MDX.VariantCalling({}),
              }),
          },
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.TRANSCRIPTOMICS,
                content: MDX.Transcriptomics({}),
              }),
          },
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.REGULATION,
                content: MDX.Regulation({}),
              }),
          },
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.ASSEMBLY,
                content: MDX.Assembly({}),
              }),
          },
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.GENOME_COMPARISONS,
                content: MDX.GenomeComparisons({}),
              }),
          },
          {
            component: C.AnalysisMethod,
            viewBuilder: (r) =>
              V.buildGenomeAnalysisMethod(r, {
                analysisMethod: ANALYSIS_METHOD.PROTEIN_FOLDING,
                content: MDX.ProteinFolding({}),
              }),
          },
        ],
        component: C.AnalysisMethods,
      },
    ],
    component: C.BackPageContentMainColumn,
  },
];
