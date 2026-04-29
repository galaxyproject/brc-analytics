import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { GA2OrganismEntity } from "../../../../../app/apis/catalog/ga2/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";

export const organismMainColumn: ComponentsConfig = [
  {
    children: [
      {
        component: C.DetailViewTable,
        viewBuilder: V.buildOrganismGenomesTable,
      },
    ],
    component: C.BackPageContentSingleColumn,
  } as ComponentConfig<typeof C.BackPageContentSingleColumn, GA2OrganismEntity>,
];
