import { BackPageContentSingleColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { type GA2OrganismDetail } from "@ga2/services/staticGeneration/organism/types";
import * as V from "@ga2/viewModelBuilders/viewModelBuilders";
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
  } as ComponentConfig<typeof BackPageContentSingleColumn, GA2OrganismDetail>,
];
