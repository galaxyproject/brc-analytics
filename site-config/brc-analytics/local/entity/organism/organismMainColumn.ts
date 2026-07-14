import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";

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
