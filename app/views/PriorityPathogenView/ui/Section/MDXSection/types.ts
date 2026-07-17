import { MDXRemoteProps, MDXRemoteSerializeResult } from "next-mdx-remote";
import { SectionProps } from "../types";

export interface Props
  extends SectionProps, Pick<MDXRemoteProps, "components"> {
  mdxRemoteSerializeResult: MDXRemoteSerializeResult;
}
