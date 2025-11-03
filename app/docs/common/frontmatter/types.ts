import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Overview } from "../../../components/Docs/components/SectionOverview/types";
import { FrontmatterProps as BaseFrontmatterProps } from "@databiosphere/findable-ui/lib/utils/mdx/frontmatter/types";
import { ComponentProps } from "react";

export type FrontmatterProps = BaseFrontmatterProps<
  ArticleFrontmatterProps &
    FrontmatterBreadcrumbProps &
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

export interface FrontmatterOutlineProps {
  enableOutline?: boolean;
}

export interface FrontmatterOverviewProps {
  overview?: Overview[];
}
