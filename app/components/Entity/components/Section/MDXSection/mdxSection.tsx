import { JSX } from "react";
import { Props } from "./types";
import { COMPONENTS } from "./constants";
import { MDXRemote } from "next-mdx-remote";
import { Section } from "../section";
import { FluidPaper } from "../../../../../components/common/Paper/components/FluidPaper/fluidPaper";

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
