import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const assembliesMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.DetailViewTable,
        viewBuilder: V.buildOrganismGenomesTable,
      },
    ],
    component: C.BackPageContentSingleColumn,
  },
];
