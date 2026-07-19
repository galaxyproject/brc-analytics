import { ParsedUrlQuery } from "querystring";

export type EntityPageMeta = Record<
  string,
  { pageDescription: string; pageTitle: string }
>;

export interface EntityPageProps<R> {
  data?: R;
  entityId: string;
  entityListType: string;
  pageDescription?: string;
  pageTitle?: string;
}

export interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}
