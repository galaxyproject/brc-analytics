/**
 * Normalise a URL pathname to a canonical form used as a state key for
 * page-scoped lookups (e.g. the handoff cell). Strips query string, fragment,
 * and trailing slashes so visually-equivalent paths compare equal regardless
 * of format quirks on either side (backend emission vs `router.asPath`).
 * Uses a loop rather than `/\/+$/` to avoid regex backtracking on adversarial
 * inputs (the bounded URL length makes ReDoS impractical, but the loop is
 * simpler to reason about and side-steps the lint rule entirely).
 * @param path - Pathname-ish string (may include query/fragment/trailing slash).
 * @returns Canonical pathname.
 */
export function normalizePagePath(path: string): string {
  const pathOnly = path.split("?")[0].split("#")[0];
  let end = pathOnly.length;
  while (end > 1 && pathOnly[end - 1] === "/") end--;
  return pathOnly.slice(0, end);
}
