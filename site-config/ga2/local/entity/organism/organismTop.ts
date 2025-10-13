import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";
import { GA2OrganismEntity } from "../../../../../app/apis/catalog/ga2/entities";

export const organismTop: ComponentsConfig = [
  {
    component: C.BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof C.BackPageHero, GA2OrganismEntity>,
];
