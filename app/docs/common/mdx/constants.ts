import { MDXComponents } from "mdx/types";
import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { SectionOverview } from "../../../components/Docs/components/SectionOverview/sectionOverview";
import { Figure } from "../../../components/common/Figure/figure";
import { Link } from "../../../components/Docs/components/common/Link/link";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { Video } from "../../../components/Docs/components/common/Video/video";
import { Table } from "../../../components/Docs/components/common/Table/table";

export const MDX_COMPONENTS: MDXComponents = {
  Alert,
  AnchorLink,
  Figure,
  SectionOverview,
  Video,
  a: Link,
  table: Table,
};
