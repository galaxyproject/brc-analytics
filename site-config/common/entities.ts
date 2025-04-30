import { EntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BackPageConfig,
  BackPageTabConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export interface BRCBackPageConfig
  extends Omit<BackPageConfig, "tabs" | "top"> {
  tabs: BRCBackPageTabConfig[];
  top?: ComponentsConfig;
}

export interface BRCBackPageTabConfig extends BackPageTabConfig {
  top?: ComponentsConfig;
}

export interface BRCEntityConfig<R> extends Omit<EntityConfig<R>, "detail"> {
  detail: BRCBackPageConfig;
}
