import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import { type BRCDataCatalogOrganism } from "@brc/apis/organism";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismTop: ComponentsConfig = [
  {
    component: BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof BackPageHero, BRCDataCatalogOrganism>,
];
