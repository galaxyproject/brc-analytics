import {
  ComponentConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import * as C from "../../../../../app/components";
import * as V from "../../../../../app/viewModelBuilders/catalog/ga2/viewModelBuilders";
import { GA2AssemblyEntity } from "../../../../../app/apis/catalog/ga2/entities";

export const top: ComponentsConfig = [
  {
    component: C.BackPageHero,
    viewBuilder: V.buildAssemblyHero,
  } as ComponentConfig<typeof C.BackPageHero, GA2AssemblyEntity>,
];
