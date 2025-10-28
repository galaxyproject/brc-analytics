import { GetStaticPropsResult } from "next/types";
import { StaticProps } from "./types";

/**
 * Processes the outline for the given static props.
 * Frontmatter outline takes precedence over static props outline.
 * Outline items with depth > 1 and < 4 are returned.
 * @param props - Static props.
 * @returns Processed outline.
 */
function sanitizeOutline(props: StaticProps): StaticProps["outline"] {
  const { frontmatter, outline } = props;

  if (!frontmatter || frontmatter.enableOutline === false) return null;
  if (!outline || !outline.length) return null;

  return outline;
}

/**
 * Processes the static props for the given static props context.
 * @param props - Static props context.
 * @returns Processed static props.
 */
export function sanitizeStaticProps(
  props: GetStaticPropsResult<StaticProps>
): GetStaticPropsResult<StaticProps> {
  if ("props" in props) {
    return {
      props: {
        ...props.props,
        outline: sanitizeOutline(props.props),
      },
    };
  }
  return props;
}
