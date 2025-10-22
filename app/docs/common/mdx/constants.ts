import { MDXComponents } from "mdx/types";
import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { SectionOverview } from "../../../components/Docs/components/SectionOverview/sectionOverview";
import { Figure } from "../../../components/common/Figure/figure";
import { Link } from "../../../components/Docs/components/common/Link/link";
import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { Video } from "../../../components/Docs/components/common/Video/video";

export const MDX_COMPONENTS: MDXComponents = {
  Alert,
  AnchorLink,
  Figure,
  SectionOverview,
  Video,
  a: Link,
};
