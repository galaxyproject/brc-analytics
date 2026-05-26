import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { FrontmatterProps as BaseFrontmatterProps } from "@databiosphere/findable-ui/lib/utils/mdx/frontmatter/types";
import { ComponentProps } from "react";
import { CardItem } from "../../../components/Docs/components/SectionContentCards/types";
import { Overview } from "../../../components/Docs/components/SectionOverview/types";

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
  cards?: CardItem[];
}

export interface FrontmatterOutlineProps {
  enableOutline?: boolean;
}

export interface FrontmatterOverviewProps {
  overview?: Overview[];
}
