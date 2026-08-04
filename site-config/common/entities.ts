import { type SiteConfig as BaseSiteConfig } from "@databiosphere/findable-ui/lib/config/entities";
import { type APP_KEYS } from "./constants";

export interface AppSiteConfig extends BaseSiteConfig {
  allowedPaths?: string[];
  appKey?: (typeof APP_KEYS)[keyof typeof APP_KEYS];
  loginEnabled?: boolean;
  maxReadRunsForBrowseAll: number;
  // Where this site's help and feedback go. Resolved per site so app code can
  // link it without naming one site's config directly.
  supportUrl?: string;
}
