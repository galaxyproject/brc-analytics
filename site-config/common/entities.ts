import { EntityConfig as BaseEntityConfig } from "@databiosphere/findable-ui/lib/config/entities";
import {
  BackPageConfig as BaseBackPageConfig,
  BackPageTabConfig as BaseBackPageTabConfig,
  ComponentsConfig,
} from "@databiosphere/findable-ui/lib/config/entities";
import { SiteConfig as BaseSiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { APP_KEYS } from "./constants";
import { TaxonomyNode } from "../../app/components/Home/components/Section/components/SectionViz/data";

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

export interface AppSiteConfig extends BaseSiteConfig {
  allowedPaths?: string[];
  appKey?: (typeof APP_KEYS)[keyof typeof APP_KEYS];
  maxReadRunsForBrowseAll: number;
  taxTree?: TaxonomyNode;
}
