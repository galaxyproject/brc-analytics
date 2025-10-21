import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";
import { Overview } from "../../../components/Docs/components/SectionOverview/types";

export type Frontmatter = FrontmatterBase &
  FrontmatterBreadcrumb &
  FrontmatterOutline;

interface FrontmatterBase {
  description: string;
  hidden?: boolean;
  subtitle?: string;
  title: string;
}

interface FrontmatterBreadcrumb {
  breadcrumbs?: Breadcrumb[];
}

export interface FrontmatterOutline {
  enableOutline?: boolean;
  outline?: OutlineItem[];
}

export interface FrontmatterOverview {
  overview?: Overview[];
}
