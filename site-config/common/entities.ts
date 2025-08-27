import { EntityConfig as BaseEntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BackPageConfig as BaseBackPageConfig,
  BackPageTabConfig as BaseBackPageTabConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export interface AppBackPageConfig
  extends Omit<BaseBackPageConfig, "tabs" | "top"> {
  tabs: AppBackPageTabConfig[];
  top?: ComponentsConfig;
}

export interface AppBackPageTabConfig extends BaseBackPageTabConfig {
  top?: ComponentsConfig;
}

export interface AppEntityConfig<R>
  extends Omit<BaseEntityConfig<R>, "detail"> {
  detail: AppBackPageConfig;
}
