import { FluidPaper } from "@repo/shared/components/Paper/components/FluidPaper/fluidPaper";
import { MDXRemote } from "next-mdx-remote";
import { JSX } from "react";
import { Section } from "../section";
import { COMPONENTS } from "./constants";
import { Props } from "./types";

export const MDXSection = ({
  components,
  mdxRemoteSerializeResult,
  ...props /* Section Props */
}: Props): JSX.Element => {
  return (
    <Section Paper={FluidPaper} {...props}>
      <MDXRemote
        components={{ ...COMPONENTS, ...components }}
        {...mdxRemoteSerializeResult}
      />
    </Section>
  );
};
