import fs from "fs";
import * as path from "path";

/**
 * Returns true if the file is an MDX file.
 * @param fileName - File name.
 * @returns true if the file is an MDX file.
 */
function isMdxFile(fileName: string): boolean {
  return fileName.endsWith(".mdx");
}

/**
 * Maps each MDX file path to its slug.
 * @param docsDirectory - Docs directory.
 * @param dirPath - Directory path.
 * @param slugByFilePaths - Accumulator: Map of slug by mdx file path.
 * @returns returns slug by mdx file path.
 */
export function mapSlugByFilePaths(
  docsDirectory: string,
  dirPath = docsDirectory,
  slugByFilePaths: Map<string, string[]> = new Map()
): Map<string, string[]> {
  const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
  return dirents.reduce((acc, dirent) => {
    /* Accumulate the slug for each MDX file. */
    if (dirent.isFile() && isMdxFile(dirent.name)) {
      const mdxPath = path.resolve(dirPath, dirent.name);
      /* Build the slug from the file relative directory and file name. */
      const mdxRelativePath = path.relative(docsDirectory, mdxPath);
      const { dir, name } = path.parse(mdxRelativePath);
      let slug = [] as string[];
      if (dir) slug = dir.split(path.sep);
      slug.push(name);
      acc.set(mdxPath, slug);
    }
    /* Recurse into subdirectories. */
    if (dirent.isDirectory()) {
      mapSlugByFilePaths(
        docsDirectory,
        path.resolve(dirPath, dirent.name),
        acc
      );
    }
    return acc;
  }, slugByFilePaths);
}

/**
 * Resolves the relative path to an absolute path for the docs directory.
 * @param relativePath - Relative paths.
 * @returns absolute path.
 */
export function resolveRelativePath(relativePath: string[]): string {
  return path.join(process.cwd(), "app", "docs", ...relativePath);
}
