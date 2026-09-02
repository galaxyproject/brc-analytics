import { type BRCOrganismDetail } from "@brc/services/staticGeneration/organism/types";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismTop: ComponentsConfig = [
  {
    component: BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof BackPageHero, BRCOrganismDetail>,
];
