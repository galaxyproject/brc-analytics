import { type TaxonomyNode } from "@/components/Home/components/Section/components/SectionViz/data";
import {
  type BackPageConfig as BaseBackPageConfig,
  type BackPageTabConfig as BaseBackPageTabConfig,
  type EntityConfig as BaseEntityConfig,
  type SiteConfig as BaseSiteConfig,
  type ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { type APP_KEYS } from "./constants";

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

export interface AppSiteConfig extends BaseSiteConfig {
  allowedPaths?: string[];
  appKey?: (typeof APP_KEYS)[keyof typeof APP_KEYS];
  loginEnabled?: boolean;
  maxReadRunsForBrowseAll: number;
  taxTree?: TaxonomyNode;
}
