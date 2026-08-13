import { CardActions } from "@brc/views/HomeView/components/SectionHero/components/Carousel/components/Cards/cards.styles";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { RoundedPaper } from "@databiosphere/findable-ui/lib/components/common/Paper/paper.styles";
import { Link } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { AlertTitle } from "@mui/material";
import { Figure } from "@repo/shared/components/mdx/Figure/figure";
import { sharedMDXComponents } from "@repo/shared/components/mdx/mdxComponents";
import { type MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    ...sharedMDXComponents,
    Alert,
    AlertTitle,
    CardActions,
    Figure,
    Link,
    RoundedPaper,
  };
}
