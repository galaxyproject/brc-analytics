import { SectionProps } from "@/components/Entity/components/Section/types";
import { MDXRemoteProps, MDXRemoteSerializeResult } from "next-mdx-remote";

export interface Props
  extends SectionProps, Pick<MDXRemoteProps, "components"> {
  mdxRemoteSerializeResult: MDXRemoteSerializeResult;
}
