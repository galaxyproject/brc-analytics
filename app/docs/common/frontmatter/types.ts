import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Overview } from "../../../components/Docs/components/SectionOverview/types";
import { FrontmatterProps as BaseFrontmatterProps } from "@databiosphere/findable-ui/lib/utils/mdx/frontmatter/types";

export type FrontmatterProps = BaseFrontmatterProps<
  FrontmatterBreadcrumbProps &
    FrontmatterOutlineProps &
    FrontmatterOverviewProps
>;

interface FrontmatterBreadcrumbProps {
  breadcrumbs?: Breadcrumb[];
}

export interface FrontmatterOutlineProps {
  enableOutline?: boolean;
}

export interface FrontmatterOverviewProps {
  overview?: Overview[];
}
