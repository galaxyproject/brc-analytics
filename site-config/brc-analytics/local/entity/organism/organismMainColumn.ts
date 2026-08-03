import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { Main as OrganismViewMain } from "@/views/OrganismView/components/Main/main";
import { BackPageContentSingleColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import { type ComponentsConfig } from "@databiosphere/findable-ui/lib/config/entities";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: OrganismViewMain,
        viewBuilder: V.buildOrganismViewMain,
      },
    ],
    component: BackPageContentSingleColumn,
  },
];
