import { sharedMDXComponents } from "@repo/shared/components/mdx/mdxComponents";
import { type MDXComponents } from "mdx/types";

// MDX custom-component registry. Next resolves this per project directory; it
// lists the components rendered by this site's MDX content.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...sharedMDXComponents,
  };
}
