import { type Outbreak } from "@brc/apis/outbreak";
import * as V from "@brc/viewModelBuilders/viewModelBuilders";
import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenTop: ComponentsConfig = [
  {
    component: BackPageHero,
    viewBuilder: V.buildPriorityPathogenHero,
  } as ComponentConfig<typeof BackPageHero, Outbreak>,
];
