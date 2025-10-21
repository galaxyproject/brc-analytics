import { GetStaticPathsResult } from "next/types";
import { mapSlugByFilePaths, resolveRelativePath } from "../files/utils";

/**
 * Generates static paths for the docs site, for the specified relative paths.
 * @param relativePaths - Relative paths.
 * @returns static paths.
 */
export function buildStaticPaths(
  relativePaths: string[]
): GetStaticPathsResult["paths"] {
  const slugByFilePaths = mapSlugByFilePaths(
    resolveRelativePath(relativePaths)
  );
  return [...slugByFilePaths].map(([, slug]) => ({ params: { slug } }));
}
