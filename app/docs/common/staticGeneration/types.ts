import { Frontmatter } from "../frontmatter/types";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

export interface StaticProps {
  frontmatter: Frontmatter;
  mdxSource: MDXRemoteSerializeResult;
  pageTitle: string;
  slug: string[];
}
