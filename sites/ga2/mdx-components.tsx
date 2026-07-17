// MDX custom-component registry for the GA2 site. GA2 MDX content (roadmap,
// partner-resources) renders custom components (Accordion, Figure, Section, …); Next
// resolves this file from the site's project root. During transition it re-exports the
// shared registry; GA2 gets its own once site content/components move per-site.
export { useMDXComponents } from "../../mdx-components";
