import { Alert } from "@databiosphere/findable-ui/lib/components/common/Alert/alert";
import { AnchorLink } from "@databiosphere/findable-ui/lib/components/common/AnchorLink/anchorLink";
import { Link } from "@repo/shared/components/mdx/Link/link";
import { Table } from "@repo/shared/components/mdx/Table/table";
import { type MDXComponents } from "mdx/types";

export const MDX_COMPONENTS: MDXComponents = {
  Alert,
  AnchorLink,
  a: Link,
  table: Table,
};
