import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";

export const mainColumn: ComponentsConfig = [
  {
    children: [
      {
        children: [],
        component: C.AnalysisMethodsCatalog,
      },
    ],
    component: C.BackPageContentMainColumn,
  },
];
