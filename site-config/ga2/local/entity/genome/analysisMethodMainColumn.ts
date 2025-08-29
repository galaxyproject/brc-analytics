import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";

export const mainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.AnalysisMethodsCatalog,
        viewBuilder: V.buildGenomeAnalysisMethods,
      },
    ],
    component: C.BackPageContentMainColumn,
  } as ComponentConfig<typeof C.BackPageContentMainColumn, GA2AssemblyEntity>,
];
