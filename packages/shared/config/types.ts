import {
  type BackPageConfig as BaseBackPageConfig,
  type BackPageTabConfig as BaseBackPageTabConfig,
  type EntityConfig as BaseEntityConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";

export interface AppBackPageConfig extends Omit<
  BaseBackPageConfig,
  "tabs" | "top"
> {
  tabs: AppBackPageTabConfig[];
  top?: ComponentsConfig;
}

export interface AppBackPageTabConfig extends BaseBackPageTabConfig {
  top?: ComponentsConfig;
}

export interface AppEntityConfig<R> extends Omit<
  BaseEntityConfig<R>,
  "detail"
> {
  detail: AppBackPageConfig;
}
