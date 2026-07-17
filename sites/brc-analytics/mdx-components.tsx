// MDX custom-component registry for the BRC site. BRC MDX content (learn, about,
// roadmap, etc.) renders custom components (Accordion, Figure, Section, …); Next
// resolves this file from the site's project root. During transition it re-exports the
// shared registry; folds into a per-site/core registry when content moves.
export { useMDXComponents } from "../../mdx-components";
