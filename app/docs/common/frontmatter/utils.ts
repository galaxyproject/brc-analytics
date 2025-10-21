import fs from "fs";
import matter from "gray-matter";
import { Frontmatter } from "./types";

/**
 * Returns matter object (frontmatter and content) from the given MDX path.
 * @param filePath - File path of MD / MDX file.
 * @returns matter object.
 */
export function getMatter(filePath: string): matter.GrayMatterFile<string> {
  const markdownWithMeta = fs.readFileSync(filePath, "utf-8");
  return matter(markdownWithMeta);
}

/**
 * Returns the frontmatter from the given grey matter file data.
 * @param data - Grey matter file data.
 * @returns frontmatter.
 */
export function sanitizeFrontmatter(
  data: matter.GrayMatterFile<string>["data"]
): Frontmatter | undefined {
  if ("title" in data) {
    const { enableOutline = true } = data;
    return {
      enableOutline,
      ...data,
    } as Frontmatter;
  }
}
