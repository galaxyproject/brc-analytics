import { ThemeOptions } from "@mui/material";
import { Frontmatter } from "../frontmatter/types";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";

export interface StaticProps {
  frontmatter: Frontmatter;
  mdxSource: MDXRemoteSerializeResult;
  outline: OutlineItem[];
  pageTitle: string;
  slug: string[];
  themeOptions: ThemeOptions;
}
