import { COMPONENTS as MARKDOWN_COMPONENTS } from "@databiosphere/findable-ui/lib/components/MarkdownRenderer/constants";
import type { Components } from "rehype-react";
import { Table } from "./components/Table/table";

export const COMPONENTS: Components = {
  ...MARKDOWN_COMPONENTS,
  table: Table,
};
