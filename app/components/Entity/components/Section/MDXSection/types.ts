import { type SectionProps } from "@/components/Entity/components/Section/types";
import {
  type MDXRemoteProps,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";

export interface Props
  extends SectionProps, Pick<MDXRemoteProps, "components"> {
  mdxRemoteSerializeResult: MDXRemoteSerializeResult;
}
