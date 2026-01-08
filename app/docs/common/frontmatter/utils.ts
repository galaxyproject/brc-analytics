import { formatDate } from "../../../utils/date-fns";
import { FrontmatterProps } from "./types";

/**
 * Maps the overview list to add formatted dates.
 * @param overview - Overview.
 * @returns Overview list with formatted dates.
 */
function formatOverview(
  overview: FrontmatterProps["overview"]
): FrontmatterProps["overview"] {
  return (overview || []).map((item) => ({
    ...item,
    date: formatDate(new Date(item.date)),
  }));
}

/**
 * Sanitizes the frontmatter by adding default values.
 * @param frontmatter - The frontmatter to sanitize.
 * @returns The sanitized frontmatter.
 */
export function sanitizeFrontmatter(
  frontmatter: FrontmatterProps | undefined
): FrontmatterProps | undefined {
  if (!frontmatter) return;

  const { enableOutline = true, overview } = frontmatter;

  return {
    ...frontmatter,
    enableOutline,
    overview: formatOverview(overview),
  };
}
