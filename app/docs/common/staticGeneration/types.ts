import { StaticProps as BaseStaticProps } from "@databiosphere/findable-ui/lib/utils/mdx/staticGeneration/types";
import { ThemeOptions } from "@mui/material";
import { FrontmatterProps } from "../frontmatter/types";

export type StaticProps = BaseStaticProps<FrontmatterProps, PageStaticProps>;

export interface PageStaticProps {
  themeOptions?: ThemeOptions;
}
