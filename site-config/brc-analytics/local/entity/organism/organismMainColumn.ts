import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.OrganismViewMain,
        viewBuilder: V.buildOrganismViewMain,
      },
    ],
    component: C.BackPageContentSingleColumn,
  },
];
