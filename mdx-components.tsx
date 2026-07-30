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
import { MDXComponents } from "mdx/types";
import * as C from "./app/components";
import { CardActions } from "./app/components/Home/components/Section/components/SectionHero/components/Carousel/components/Cards/cards.styles";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    Accordion,
    AccordionDetails: MAccordionDetails,
    AccordionSummary,
    Alert: C.Alert,
    AlertTitle,
    CardActions,
    Figure,
    Grid: C.Grid,
    Link: C.Link,
    RoundedPaper: C.RoundedPaper,
    Section,
    SectionContent,
    SectionHeadline,
    SectionLayout,
    SubHeadline,
    a: ({ children, href }) => C.Link({ label: children, url: href ?? "" }),
  };
}
