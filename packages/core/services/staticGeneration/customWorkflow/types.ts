import { ParsedUrlQuery } from "querystring";

export interface CustomWorkflowMeta {
  pageDescription: string;
  pageTitle: string;
}

export interface CustomWorkflowProps {
  entityId: string;
  pageDescription?: string;
  pageTitle?: string;
  trsId: string;
}

export interface Params extends ParsedUrlQuery {
  entityId: string;
  entityListType: string;
}
