import { Grid } from "@databiosphere/findable-ui/lib/components/common/Grid/grid";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { AccordionDetails as MAccordionDetails } from "@mui/material";
import { Accordion } from "@repo/shared/components/Accordion/accordion";
import { AccordionSummary } from "@repo/shared/components/Accordion/components/AccordionSummary/accordionSummary";
import {
  Section,
  SectionContent,
  SectionHeadline,
  SectionLayout,
  SubHeadline,
} from "@repo/shared/views/docs/content.styles";
import { type MDXComponents } from "mdx/types";

// MDX custom-component registry. Next resolves this per project directory; it
// lists the components rendered by this site's MDX content.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Accordion,
    AccordionDetails: MAccordionDetails,
    AccordionSummary,
    Grid,
    Section,
    SectionContent,
    SectionHeadline,
    SectionLayout,
    SubHeadline,
    a: ({ children, href }) => Link({ label: children, url: href ?? "" }),
  };
}
