import { type GA2OrganismEntity } from "@/apis/catalog/ga2/entities";
import * as V from "@/viewModelBuilders/catalog/ga2/viewModelBuilders";
import { BackPageContentSingleColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { Main as OrganismViewMain } from "@ga2/views/OrganismView/components/Main/main";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: OrganismViewMain,
        viewBuilder: V.buildOrganismViewMain,
      },
    ],
    component: BackPageContentSingleColumn,
  } as ComponentConfig<typeof BackPageContentSingleColumn, GA2OrganismEntity>,
];
