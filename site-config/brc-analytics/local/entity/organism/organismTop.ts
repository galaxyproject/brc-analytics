import { type BRCDataCatalogOrganism } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismTop: ComponentsConfig = [
  {
    component: C.BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof C.BackPageHero, BRCDataCatalogOrganism>,
];
