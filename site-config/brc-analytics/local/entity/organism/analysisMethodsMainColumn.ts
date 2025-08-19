import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const mainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.AnalysisMethodsCatalog,
        viewBuilder: V.buildOrganismAnalysisMethods,
      },
    ],
    component: C.BackPageContentMainColumn,
  },
];
