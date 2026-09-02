import { type BRCOrganismDetail } from "@brc/services/staticGeneration/organism/types";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { Main as OrganismViewMain } from "@brc/views/OrganismView/components/Main/main";
import { BackPageContentSingleColumn } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/backPageView.styles";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: OrganismViewMain,
        viewBuilder: V.buildOrganismViewMain,
      },
    ],
    component: BackPageContentSingleColumn,
  } as ComponentConfig<typeof BackPageContentSingleColumn, BRCOrganismDetail>,
];
