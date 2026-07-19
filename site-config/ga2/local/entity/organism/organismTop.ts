import { GA2OrganismEntity } from "@/apis/catalog/ga2/entities";
import * as C from "@/components";
import * as V from "@/viewModelBuilders/catalog/ga2/viewModelBuilders";
import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export const organismTop: ComponentsConfig = [
  {
    component: C.BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof C.BackPageHero, GA2OrganismEntity>,
];
