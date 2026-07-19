import { Outbreak } from "@/apis/catalog/brc-analytics-catalog/common/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/brc-analytics-catalog/common/viewModelBuilders";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const priorityPathogenTop: ComponentsConfig = [
  {
    component: C.BackPageHero,
    viewBuilder: V.buildPriorityPathogenHero,
  } as ComponentConfig<typeof C.BackPageHero, Outbreak>,
];
