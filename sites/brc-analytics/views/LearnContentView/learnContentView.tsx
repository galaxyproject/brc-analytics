import { MDX_COMPONENTS } from "@brc/mdx/constants";
import type { StaticProps } from "@repo/shared/views/docs/common/staticGeneration/types";
import { ContentView } from "@repo/shared/views/docs/ContentView/contentView";
import { type JSX } from "react";

export const LearnContentView = (props: StaticProps): JSX.Element | null => {
  return <ContentView {...props} components={MDX_COMPONENTS} />;
};
