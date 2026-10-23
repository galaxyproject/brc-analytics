import { BLOG_MDX_COMPONENTS, MDX_COMPONENTS } from "@brc/mdx/constants";
import { type MDXComponents } from "mdx/types";

const BLOG_SLUG = ["learn", "blog"];

/**
 * MDX components for the page: blog posts add the lightbox figure.
 * @param slug - Page slug.
 * @returns The page's MDX components.
 */
export function getMDXComponents(slug: string[]): MDXComponents {
  return isBlogPost(slug) ? BLOG_MDX_COMPONENTS : MDX_COMPONENTS;
}

/**
 * Whether the slug is a blog post's, i.e. learn/blog/<post>.
 * @param slug - Page slug.
 * @returns True for a blog post.
 */
export function isBlogPost(slug: string[]): boolean {
  return (
    slug.length > BLOG_SLUG.length &&
    BLOG_SLUG.every((segment, index) => slug[index] === segment)
  );
}
