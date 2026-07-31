import type { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import type { FrontmatterProps as BaseFrontmatterProps } from "@databiosphere/findable-ui/lib/utils/mdx/frontmatter/types";
import type { SectionContentCard } from "@repo/shared/views/docs/components/SectionContentCard/sectionContentCard";
import type { Overview } from "@repo/shared/views/docs/components/SectionOverview/types";
import type { ComponentProps } from "react";

export type FrontmatterProps = BaseFrontmatterProps<
  ArticleFrontmatterProps &
    FrontmatterBreadcrumbProps &
    FrontmatterCardsProps &
    FrontmatterOutlineProps &
    FrontmatterOverviewProps
>;

interface ArticleFrontmatterProps {
  contentType?: CONTENT_TYPE;
  heroImage?: Pick<ComponentProps<"img">, "alt" | "src">;
}

export enum CONTENT_TYPE {
  ARTICLE = "ARTICLE",
}

interface FrontmatterBreadcrumbProps {
  breadcrumbs?: Breadcrumb[];
}

export interface FrontmatterCardsProps {
  cards?: ComponentProps<typeof SectionContentCard>[];
}

export interface FrontmatterOutlineProps {
  enableOutline?: boolean;
}

export interface FrontmatterOverviewProps {
  overview?: Overview[];
}
