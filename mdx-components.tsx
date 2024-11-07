import {
  AlertTitle,
  AccordionDetails as MAccordionDetails,
} from "@mui/material";
import { MDXComponents } from "mdx/types";
import * as C from "./app/components";
import { CardActions } from "./app/components/Home/components/Section/components/SectionHero/components/Carousel/components/Cards/cards.styles";
import { Accordion } from "./app/components/common/Accordion/accordion";
import { AccordionSummary } from "./app/components/common/Accordion/components/AccordionSummary/accordionSummary";
import { Figure } from "./app/components/common/Figure/figure";
import {
  Section,
  SectionContent,
  SectionHeadline,
  SectionLayout,
  SubHeadline,
} from "./app/components/content/content.styles";

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
