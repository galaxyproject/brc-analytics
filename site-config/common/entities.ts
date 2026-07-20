import { TaxonomyNode } from "@/components/Home/components/Section/components/SectionViz/data";
import {
  BackPageConfig as BaseBackPageConfig,
  BackPageTabConfig as BaseBackPageTabConfig,
  EntityConfig as BaseEntityConfig,
  SiteConfig as BaseSiteConfig,
  ComponentsConfig,
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

export interface AppSiteConfig extends BaseSiteConfig {
  loginEnabled?: boolean;
  maxReadRunsForBrowseAll: number;
  taxTree?: TaxonomyNode;
}
