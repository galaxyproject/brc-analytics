import { type MDXRemoteSerializeResult } from "next-mdx-remote";
import {
  type OUTBREAK_PRIORITY,
  type OUTBREAK_RESOURCE_TYPE,
} from "./schema-types";

export interface Outbreak {
  description: MDXRemoteSerializeResult;
  highlight_descendant_taxonomy_ids: number[] | null;
  name: string;
  priority: OUTBREAK_PRIORITY;
  resources: OutbreakResource[];
  taxonName?: string;
  taxonNameField?: string;
  taxonomy_id: number;
}

export interface OutbreakResource {
  title: string;
  type: OUTBREAK_RESOURCE_TYPE;
  url: string;
}
