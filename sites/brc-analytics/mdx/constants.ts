import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { Figure } from "@repo/shared/components/mdx/Figure/figure";
import { Link } from "@repo/shared/components/mdx/Link/link";
import { Table } from "@repo/shared/components/mdx/Table/table";
import { VegaEmbed } from "@repo/shared/components/mdx/VegaEmbed/vegaEmbed";
import { Video } from "@repo/shared/components/mdx/Video/video";
import { SectionContentCards } from "@repo/shared/views/docs/components/SectionContentCards/sectionContentCards";
import { SectionOverview } from "@repo/shared/views/docs/components/SectionOverview/sectionOverview";
import { type MDXComponents } from "mdx/types";

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
