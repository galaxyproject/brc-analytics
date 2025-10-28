import { FrontmatterProps } from "./types";

/**
 * Sanitizes the frontmatter by adding default values.
 * @param frontmatter - The frontmatter to sanitize.
 * @returns The sanitized frontmatter.
 */
export function sanitizeFrontmatter(
  frontmatter: FrontmatterProps | undefined
): FrontmatterProps | undefined {
  if (!frontmatter) return;

  const { enableOutline = true } = frontmatter || {};

  return {
    ...frontmatter,
    enableOutline,
  };
}
