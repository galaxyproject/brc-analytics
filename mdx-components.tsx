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
import { CodeBlock } from "./app/components/Learn/components/CodeBlock/codeBlock";
import { DocLayout } from "./app/components/Learn/DocLayout";
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
    CodeBlock,
    DocLayout,
    Figure,
    Grid: C.Grid,
    Link: C.Link,
    RoundedPaper: C.RoundedPaper,
    Section,
    SectionContent,
    SectionHeadline,
    SectionLayout,
    SubHeadline,
    a: ({ children, href }): JSX.Element =>
      C.Link({ label: children, url: href ?? "" }),
    // Handle code blocks with language classes
    pre: (props): JSX.Element => {
      const child = props.children as {
        props?: { children?: string; className?: string };
      };
      const codeProps = child?.props;
      if (codeProps && typeof codeProps.className === "string") {
        const language = codeProps.className.replace("language-", "");
        return <CodeBlock language={language}>{codeProps.children}</CodeBlock>;
      }
      return <pre {...props} />;
    },
  };
}
