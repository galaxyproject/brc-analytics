import { SectionContentCards } from "@/components/Docs/components/SectionContentCards/sectionContentCards";
import { SectionOverview } from "@/components/Docs/components/SectionOverview/sectionOverview";
import { Link } from "@/components/Docs/components/common/Link/link";
import { Table } from "@/components/Docs/components/common/Table/table";
import { Video } from "@/components/Docs/components/common/Video/video";
import { VegaEmbed } from "@/components/common/VegaEmbed/vegaEmbed";
import { Figure } from "@brc-analytics/core/components/mdx/Figure/figure";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { MDXComponents } from "mdx/types";

export const MDX_COMPONENTS: MDXComponents = {
  Alert,
  AnchorLink,
  Figure,
  SectionContentCards,
  SectionOverview,
  VegaEmbed,
  Video,
  a: Link,
  table: Table,
};
