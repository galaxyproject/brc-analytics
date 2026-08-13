import type { PageMeta } from "@repo/shared/meta/types";
import type { ParsedUrlQuery } from "querystring";

/**
 * URL params for a workflow detail page.
 */
export interface WorkflowPageParams extends ParsedUrlQuery {
  trsId: string;
}

/**
 * Props for a workflow detail page.
 */
export interface WorkflowPageProps extends Partial<PageMeta> {
  trsId: string;
}
