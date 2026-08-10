import { CardActions } from "@brc/views/HomeView/components/SectionHero/components/Carousel/components/Cards/cards.styles";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { Grid } from "@databiosphere/findable-ui/lib/components/common/Grid/grid";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import {
  AlertTitle,
  AccordionDetails as MAccordionDetails,
} from "@mui/material";
import { Accordion } from "@repo/shared/components/Accordion/accordion";
import { AccordionSummary } from "@repo/shared/components/Accordion/components/AccordionSummary/accordionSummary";
import { Figure } from "@repo/shared/components/mdx/Figure/figure";
import {
  Section,
  SectionContent,
  SectionHeadline,
  SectionLayout,
  SubHeadline,
} from "@repo/shared/views/docs/content.styles";
import { type MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Accordion,
    AccordionDetails: MAccordionDetails,
    AccordionSummary,
    Alert,
    AlertTitle,
    CardActions,
    Figure,
    Grid,
    Link,
    RoundedPaper,
    Section,
    SectionContent,
    SectionHeadline,
    SectionLayout,
    SubHeadline,
    a: ({ children, href }) => Link({ label: children, url: href ?? "" }),
  };
}
