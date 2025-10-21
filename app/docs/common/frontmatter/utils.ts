import fs from "fs";
import matter from "gray-matter";
import { mapSlugByFilePaths, resolveRelativePath } from "../files/utils";
import { Frontmatter } from "./types";

/**
 * Returns list of paths and frontmatter tuples for the given relative paths.
 * @param relativePaths - Relative paths.
 * @returns list of paths and frontmatter tuples.
 */
export function getFrontmatterPaths(
  relativePaths: string[]
): [string, Frontmatter][] {
  const slugByFilePaths = mapSlugByFilePaths(
    resolveRelativePath(relativePaths)
  );
  return [...getFrontmatterByPaths(slugByFilePaths)];
}

/**
 * Returns Map of frontmatter by path.
 * @param slugByFilePaths - Map slug by file path.
 * @returns Map of frontmatter by path.
 */
export function getFrontmatterByPaths(
  slugByFilePaths: Map<string, string[]>
): Map<string, Frontmatter> {
  const frontmatterByPath: Map<string, Frontmatter> = new Map();
  for (const [filePath, slug] of [...slugByFilePaths]) {
    const { data: frontmatter } = getMatter(filePath);
    const path = slug.join("/");
    if (path) frontmatterByPath.set(path, frontmatter as Frontmatter);
  }
  return frontmatterByPath;
}

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
