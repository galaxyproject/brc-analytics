import { OutlineItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Outline/types";
import { StaticProps } from "./types";

/**
 * Filters out headings (H1, and H3-H6) from the outline.
 * @param outline - Outline item.
 * @returns true if the heading depth is 2 or 3.
 */
function filterOutline(outline: OutlineItem): boolean {
  return outline.depth > 1 && outline.depth < 4;
}

/**
 * Processes the outline for the given static props.
 * Frontmatter outline takes precedence over static props outline.
 * Outline items with depth > 1 and < 4 are returned.
 * @param props - Static props.
 * @returns Processed outline.
 */
export function sanitizeOutline(props: StaticProps): StaticProps["outline"] {
  const { frontmatter } = props;

  if (frontmatter.enableOutline === false) return [];

  const outline: StaticProps["outline"] = frontmatter.outline || props.outline;

  if (!outline || !outline.length) return [];

  return outline.filter(filterOutline);
}
