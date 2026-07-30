import type { StaticProps as BaseStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/types";
import type { ThemeOptions } from "@mui/material";
import type { FrontmatterProps } from "../frontmatter/types";

export type StaticProps = BaseStaticProps<FrontmatterProps, PageStaticProps>;

export interface PageStaticProps {
  themeOptions?: ThemeOptions;
}
