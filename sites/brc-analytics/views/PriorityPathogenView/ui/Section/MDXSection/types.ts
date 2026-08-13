import { type SectionProps } from "@brc/views/PriorityPathogenView/ui/Section/types";
import {
  type MDXRemoteProps,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";

export interface Props
  extends SectionProps, Pick<MDXRemoteProps, "components"> {
  mdxRemoteSerializeResult: MDXRemoteSerializeResult;
}
