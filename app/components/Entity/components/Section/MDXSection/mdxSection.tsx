import { Section } from "@/components/Entity/components/Section/section";
import { FluidPaper } from "@repo/shared/components/Paper/components/FluidPaper/fluidPaper";
import { MDXRemote } from "next-mdx-remote";
import { type JSX } from "react";
import { COMPONENTS } from "./constants";
import { type Props } from "./types";

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
