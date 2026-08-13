import {
  type BackPageConfig as BaseBackPageConfig,
  type BackPageTabConfig as BaseBackPageTabConfig,
  type EntityConfig as BaseEntityConfig,
  type SiteConfig as BaseSiteConfig,
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

/**
 * Site config consumed by shared code — extends findable-ui's base config with
 * the app-level fields each site provides.
 */
export interface AppSiteConfig extends BaseSiteConfig {
  loginEnabled?: boolean;
  maxReadRunsForBrowseAll: number;
  // Where this site's help and feedback go. Resolved per site so shared code can
  // link it without naming one site's config directly.
  supportUrl?: string;
}
