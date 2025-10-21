import { LinkProps } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";

const MAX_ROWS = 3;

/**
 * Splits group overview links into two arrays suitable for a two-column layout.
 * @param links - Section overview links.
 * @returns section overview links, evenly split into two arrays.
 */
export function splitLinks(links: LinkProps[]): LinkProps[][] {
  const sliceIndex = Math.max(MAX_ROWS, Math.ceil(links.length / 2));
  return [links.slice(0, sliceIndex), links.slice(sliceIndex)];
}
