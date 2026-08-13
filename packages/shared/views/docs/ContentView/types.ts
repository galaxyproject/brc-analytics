import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import type { MDXComponents } from "mdx/types";

export interface Props extends StaticProps {
  components: MDXComponents;
}
