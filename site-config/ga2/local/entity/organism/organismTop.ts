import { BackPageHero } from "@databiosphere/findable-ui/lib/components/Layout/components/BackPage/components/BackPageHero/backPageHero";
import {
  type ComponentConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { type GA2OrganismEntity } from "@ga2/apis/organism";
import * as V from "@ga2/viewModelBuilders/viewModelBuilders";

export const organismTop: ComponentsConfig = [
  {
    component: BackPageHero,
    viewBuilder: V.buildOrganismHero,
  } as ComponentConfig<typeof BackPageHero, GA2OrganismEntity>,
];
