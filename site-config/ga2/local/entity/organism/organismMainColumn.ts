import { GA2OrganismEntity } from "@/apis/catalog/ga2/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/ga2/viewModelBuilders";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.OrganismViewMain,
        viewBuilder: V.buildOrganismViewMain,
      },
    ],
    component: C.BackPageContentSingleColumn,
  } as ComponentConfig<typeof C.BackPageContentSingleColumn, GA2OrganismEntity>,
];
