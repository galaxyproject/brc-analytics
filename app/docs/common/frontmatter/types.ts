import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";

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
