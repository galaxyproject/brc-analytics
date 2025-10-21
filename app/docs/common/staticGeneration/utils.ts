import { GetStaticPropsContext } from "next/types";

/**
 * Returns the page slug for the given static props context and section.
 * @param props - Static props context.
 * @param section - Docs section e.g. "learn".
 * @returns page slug.
 */
export function buildSlug(
  props: GetStaticPropsContext,
  section?: string
): string[] | undefined {
  const slug = props.params?.slug;
  if (!slug || typeof slug === "string") return;
  if (section) return [section, ...slug];
  return slug;
}
