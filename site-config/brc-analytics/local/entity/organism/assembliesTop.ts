import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { BRCDataCatalogOrganism } from "../../../../../app/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";

export const assembliesTop: ComponentsConfig = [
  {
    component: C.DetailViewHero,
    viewBuilder: V.buildOrganismAssembliesDetailViewHero,
  } as ComponentConfig<typeof C.DetailViewHero, BRCDataCatalogOrganism>,
];
