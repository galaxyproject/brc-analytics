import type { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import type { ReactNode } from "react";

/**
 * "home" is the search page's band, wide and with room underneath for the
 * search card to overlap it; "article" lines up with a docs page's text column.
 */
export type HeroVariant = "article" | "home";

export interface Props {
  breadcrumbs?: Breadcrumb[];
  head: ReactNode;
  stats?: string[];
  subHead?: ReactNode;
  variant: HeroVariant;
}
